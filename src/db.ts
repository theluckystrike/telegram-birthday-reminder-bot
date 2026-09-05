import { BaseStore, FleetStats, now } from "./kit.ts";

export interface GroupRow { chat_id: number; title: string; pro: number; tz_min: number; tz_set: number; greeting: string | null; }
export interface BirthdayRow { chat_id: number; user_id: number; name: string; day: number; month: number; year: number | null; last_greeted_year: number; last_dm_year: number; }

const SCHEMA = `
CREATE TABLE IF NOT EXISTS groups (chat_id INTEGER PRIMARY KEY, title TEXT NOT NULL DEFAULT '', pro INTEGER NOT NULL DEFAULT 0,
  paid_charge TEXT, tz_min INTEGER NOT NULL DEFAULT 0, tz_set INTEGER NOT NULL DEFAULT 0, greeting TEXT, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS members (chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, last_seen INTEGER NOT NULL, PRIMARY KEY (chat_id, user_id));
CREATE TABLE IF NOT EXISTS birthdays (chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, name TEXT NOT NULL, day INTEGER NOT NULL,
  month INTEGER NOT NULL, year INTEGER, last_greeted_year INTEGER NOT NULL DEFAULT 0, last_dm_year INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL, PRIMARY KEY (chat_id, user_id));
CREATE TABLE IF NOT EXISTS starters (user_id INTEGER PRIMARY KEY, ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sources (user_id INTEGER PRIMARY KEY, src TEXT NOT NULL, ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);`;

const QA_CHAT = -1001234567890;

export class Store extends BaseStore {
  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env, SCHEMA);
  }

  async touchGroup(chatId: number, title: string): Promise<GroupRow> {
    this.run(`INSERT INTO groups (chat_id, title, created) VALUES (?1, ?2, ?3)
              ON CONFLICT(chat_id) DO UPDATE SET title = CASE WHEN ?2 = '' THEN title ELSE ?2 END`, chatId, title, now());
    return this.one<GroupRow>("SELECT chat_id, title, pro, tz_min, tz_set, greeting FROM groups WHERE chat_id = ?1", chatId)
      ?? { chat_id: chatId, title, pro: 0, tz_min: 0, tz_set: 0, greeting: null };
  }
  async group(chatId: number): Promise<GroupRow | null> {
    return this.one<GroupRow>("SELECT chat_id, title, pro, tz_min, tz_set, greeting FROM groups WHERE chat_id = ?1", chatId);
  }
  async touchMember(chatId: number, userId: number): Promise<void> {
    this.run("INSERT INTO members (chat_id, user_id, last_seen) VALUES (?1, ?2, ?3) ON CONFLICT(chat_id, user_id) DO UPDATE SET last_seen = ?3", chatId, userId, now());
  }
  async setGroupTz(chatId: number, tzMin: number): Promise<void> { this.run("UPDATE groups SET tz_min = ?2, tz_set = 1 WHERE chat_id = ?1", chatId, tzMin); }
  async setGreeting(chatId: number, text: string): Promise<void> { this.run("UPDATE groups SET greeting = ?2 WHERE chat_id = ?1", chatId, text); }
  /** Upsert: a group may have no `groups` row yet (Pro bought before its first /bday, /gtz
   * or /greeting) — an UPDATE-only statement would silently write 0 rows and lose the sale. */
  async setGroupPro(chatId: number, charge: string): Promise<void> {
    this.run(`INSERT INTO groups (chat_id, pro, paid_charge, created) VALUES (?1, 1, ?2, ?3)
              ON CONFLICT(chat_id) DO UPDATE SET pro = 1, paid_charge = ?2`, chatId, charge, now());
  }

  async hasBirthday(chatId: number, userId: number): Promise<boolean> {
    return this.one("SELECT 1 FROM birthdays WHERE chat_id = ?1 AND user_id = ?2", chatId, userId) !== null;
  }
  async countBirthdays(chatId: number): Promise<number> {
    return (this.one<{ n: number }>("SELECT COUNT(*) AS n FROM birthdays WHERE chat_id = ?1", chatId) ?? { n: 0 }).n;
  }
  async upsertBirthday(chatId: number, userId: number, name: string, day: number, month: number, year: number | undefined): Promise<void> {
    this.run(`INSERT INTO birthdays (chat_id, user_id, name, day, month, year, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
              ON CONFLICT(chat_id, user_id) DO UPDATE SET name = ?3, day = ?4, month = ?5, year = ?6`,
      chatId, userId, name, day, month, year ?? null, now());
  }
  async birthdaysOf(chatId: number): Promise<BirthdayRow[]> {
    return this.all<BirthdayRow>("SELECT * FROM birthdays WHERE chat_id = ?1 ORDER BY user_id LIMIT 2000", chatId);
  }
  async markGreeted(chatId: number, userId: number, year: number): Promise<void> {
    this.run("UPDATE birthdays SET last_greeted_year = ?3 WHERE chat_id = ?1 AND user_id = ?2", chatId, userId, year);
  }
  async markDm(chatId: number, userId: number, year: number): Promise<void> {
    this.run("UPDATE birthdays SET last_dm_year = ?3 WHERE chat_id = ?1 AND user_id = ?2", chatId, userId, year);
  }
  /** Every group with at least one stored birthday — the hourly cron filters this list by
   * local hour, so it's bounded (not per-user) and cheap even with many idle groups. */
  async groupsWithBirthdays(): Promise<GroupRow[]> {
    return this.all<GroupRow>(`SELECT DISTINCT g.chat_id, g.title, g.pro, g.tz_min, g.tz_set, g.greeting FROM groups g
      WHERE g.chat_id != ${QA_CHAT} AND EXISTS (SELECT 1 FROM birthdays b WHERE b.chat_id = g.chat_id) LIMIT 5000`);
  }
  /** Other members of a group known to have started this bot in private (DM-able), for the
   * Pro day-before reminder. Excludes the birthday person themself. */
  async dmableMembers(chatId: number, exceptUserId: number): Promise<number[]> {
    return this.all<{ user_id: number }>(
      `SELECT m.user_id AS user_id FROM members m JOIN starters s ON s.user_id = m.user_id
       WHERE m.chat_id = ?1 AND m.user_id != ?2 LIMIT 200`, chatId, exceptUserId).map((r) => r.user_id);
  }
  async markStarted(userId: number): Promise<void> { this.run("INSERT OR IGNORE INTO starters (user_id, ts) VALUES (?1, ?2)", userId, now()); }
  /** Groups the given user is a known member of (via /bday, /upcoming, or any group message) — for the Mini App. */
  async groupsOf(userId: number): Promise<{ chat_id: number; title: string }[]> {
    return this.all("SELECT g.chat_id, g.title FROM groups g JOIN members m ON m.chat_id = g.chat_id WHERE m.user_id = ?1 ORDER BY g.created DESC LIMIT 20", userId);
  }
  async addSource(userId: number, src: string): Promise<void> { this.run("INSERT OR IGNORE INTO sources (user_id, src, ts) VALUES (?1, ?2, ?3)", userId, src, now()); }
  async incr(key: string): Promise<void> { this.run("INSERT INTO counters (key, n) VALUES (?1, 1) ON CONFLICT(key) DO UPDATE SET n = n + 1", key); }
  async counter(key: string): Promise<number> { return (this.one<{ n: number }>("SELECT n FROM counters WHERE key = ?1", key) ?? { n: 0 }).n; }

  async stats(): Promise<FleetStats> {
    const u = this.userStats();
    const g = this.one<{ n: number; p: number | null }>(`SELECT COUNT(*) AS n, SUM(pro) AS p FROM groups WHERE chat_id != ${QA_CHAT}`);
    const b = this.one<{ n: number }>(
      `SELECT COUNT(*) AS n FROM birthdays WHERE chat_id != ${QA_CHAT} AND ${this.notTestUser("user_id")}`);
    const qg = this.one<{ n: number }>(`SELECT COUNT(*) AS n FROM groups WHERE pro = 1 AND chat_id = ${QA_CHAT}`);
    const sr = this.all<{ src: string; n: number }>(`SELECT src, COUNT(*) AS n FROM sources WHERE ${this.notTestUser("user_id")} GROUP BY src`);
    const s: Record<string, number> = {};
    for (const r of sr) s["src_" + r.src] = r.n;
    const [greetingsSent, dmReminders] = await Promise.all([this.counter("greetings_sent"), this.counter("dm_reminders")]);
    return { ...u, ...s, qa_pro: u.qa_pro + (qg?.n ?? 0), pro: (g?.p ?? 0) + u.pro, events: b?.n ?? 0, groups: g?.n ?? 0, greetings_sent: greetingsSent, dm_reminders: dmReminders };
  }
}
