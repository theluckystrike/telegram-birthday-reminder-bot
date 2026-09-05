/** Pure parsing / date-math / business-rule helpers for BirthdayBot. No I/O, no imports across dirs. */
import { t } from "./i18n.ts";
import type { Lang } from "./i18n.ts";
import type { GuestReply } from "./guest.ts";

const MIN = 60;

export interface Bday { day: number; month: number; year?: number; }
export interface MonthDay { day: number; month: number; }
export interface LocalDate { year: number; month: number; day: number; }

/** Days in `month` (1-12) for `year` — used both to validate a stored date and to fold a
 * Feb 29 birthday onto Feb 28 in a non-leap year. */
export function daysInMonth(month: number, year: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** "14-03" | "14-03-1990" -> {day, month, year?}, or null if unparseable / out of range.
 * A yearless "29-02" is accepted (validated against a reference leap year); a year that
 * makes Feb 29 impossible (e.g. "29-02-2019") is rejected. */
export function parseBday(text: string): Bday | null {
  const m = text.trim().match(/^(\d{1,2})-(\d{1,2})(?:-(\d{4}))?$/);
  if (!m) return null;
  const day = Number(m[1]), month = Number(m[2]);
  const year = m[3] ? Number(m[3]) : undefined;
  if (month < 1 || month > 12) return null;
  if (year !== undefined && (year < 1900 || year > 2100)) return null;
  const dim = daysInMonth(month, year ?? 2000); // 2000 is a leap year: lets a yearless 29-02 through
  if (day < 1 || day > dim) return null;
  return { day, month, year };
}

/** Local hour (0-23) for a UTC timestamp and tz offset in minutes. */
export const localHour = (sec: number, tzMin: number): number => {
  const d = new Date((sec + tzMin * MIN) * 1000);
  return d.getUTCHours();
};

/** Local calendar date for a UTC timestamp and tz offset in minutes. */
export function localDate(sec: number, tzMin: number): LocalDate {
  const d = new Date((sec + tzMin * MIN) * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** date + n days (n may be negative), calendar-correct across month/year boundaries. */
export function addDays(date: LocalDate, n: number): LocalDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day) + n * 86_400_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Days from `from` to the next occurrence of `b` (0 = today), Feb 29 folded to Feb 28 in a
 * non-leap year. Bounded to a 2-year lookahead (this year, then next). */
export function daysUntil(b: MonthDay, from: LocalDate): number {
  const fromTs = Date.UTC(from.year, from.month - 1, from.day);
  for (let dy = 0; dy <= 1; dy++) {
    const y = from.year + dy;
    const dim = daysInMonth(b.month, y);
    const d = b.month === 2 && b.day === 29 && dim < 29 ? 28 : b.day;
    const diff = Math.round((Date.UTC(y, b.month - 1, d) - fromTs) / 86_400_000);
    if (diff >= 0) return diff;
  }
  return 0; // unreachable: dy=1 always yields a non-negative diff
}

/** True if `b` falls due today (and hasn't already been greeted this local year). */
export function isDueToday(b: MonthDay, today: LocalDate, lastGreetedYear: number): boolean {
  return daysUntil(b, today) === 0 && lastGreetedYear !== today.year;
}

/** True if `b` falls due tomorrow (and hasn't already gotten this year's day-before DM). */
export function isDueTomorrow(b: MonthDay, today: LocalDate, lastDmYear: number): boolean {
  return daysUntil(b, addDays(today, 1)) === 0 && lastDmYear !== today.year;
}

/** Retry-safe ordering gate for the hourly cron (P0-5): `last_greeted_year` may be stamped
 * ONLY when the greeting message actually sent. A caller that stamps it regardless of `sent`
 * loses the greeting for a full year on one 429 or transient network error, with no way to
 * retry before the next birthday. Pure so the ordering itself is unit-tested without a bot. */
export function shouldMarkGreeted(sent: boolean): boolean { return sent; }

export function parseTz(s: string): number | null {
  const m = s.trim().match(/^(?:utc)?\s*([+-])?(\d{1,2})(?::?(\d{2}))?$/i);
  if (!m) return null;
  const h = Number(m[2]), mi = Number(m[3] ?? "0");
  if (h > 14 || mi > 59) return null;
  return (m[1] === "-" ? -1 : 1) * (h * 60 + mi);
}

/** Free groups may store at most `limit` birthdays; Pro is unlimited. */
export function canAddMember(existingCount: number, pro: boolean, limit = 25): boolean {
  return pro || existingCount < limit;
}

/** Deep-link encoding for a (possibly negative) group chat id: "-" <-> "m". */
export const encodeChatId = (id: number): string => String(id).replace("-", "m");
export function decodeChatId(s: string): number | null {
  if (!/^m?\d+$/.test(s)) return null;
  const n = Number(s.startsWith("m") ? "-" + s.slice(1) : s);
  return Number.isFinite(n) ? n : null;
}

/** First-touch attribution payload on /start (e.g. "site", "share"), never "pro" or "pro_<id>". */
export const SOURCE_PAYLOAD_RE = /^[a-z]{2,12}$/;
export function isSourcePayload(s: string): boolean { return s !== "pro" && SOURCE_PAYLOAD_RE.test(s); }

/** Telegram's pseudo-user id for "sent by a group's anonymous admin", the "linked channel"
 * bot, and the Telegram service account — never treated as a real person. */
export const PSEUDO_SENDER_IDS = new Set([1087968824, 136817688, 777000]);
export function isRealSender(fromId: number | undefined, viaBot: unknown, senderChat?: unknown): boolean {
  return fromId !== undefined && !PSEUDO_SENDER_IDS.has(fromId) && !viaBot && !senderChat;
}

/** Pro's custom greeting, substituting {name}; falls back to a plain default when there is
 * no template, and appends the name when the template forgot the placeholder. */
export function greetingText(name: string, template?: string | null): string {
  if (!template) return `🎂 Happy birthday, ${name}!`;
  return template.includes("{name}") ? template.replaceAll("{name}", name) : `${template} ${name}!`;
}

/** Format an upcoming-birthdays list line: "Name — in N days" (or "today"/"tomorrow"). */
export function daysLeftLabel(n: number): string {
  return n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`;
}

const guestPlain = (s: string): string => s.replaceAll("*", "").replaceAll("`", "");

/** Pure guest-reply builder: given the query text (already stripped of the @mention), the
 * summoner's language, and the free-tier cap for the pitch, returns the guest result
 * content — no ctx, no store, so it is unit-testable under plain node. A parseable date
 * becomes a days-until preview (no group to greet in from a guest summon); a bad or empty
 * query gets the localized /start pitch. */
export function buildGuestReply(q: string, lang: Lang, freeBirthdays: number, proStars: number, today: LocalDate, botUsername: string): GuestReply {
  const p = q ? parseBday(q) : null;
  if (!p) {
    return {
      title: "🎂 " + botUsername + " — never forget a group birthday",
      description: "Try: @" + botUsername + " 14-03",
      text: guestPlain(t(lang, "start", { free: freeBirthdays, stars: proStars })),
    };
  }
  const when = String(p.day).padStart(2, "0") + "-" + String(p.month).padStart(2, "0");
  const days = daysUntil(p, today);
  return {
    title: `🎂 ${daysLeftLabel(days)} — ${when}`,
    description: when,
    text: guestPlain(t(lang, "guestDaysUntil", { when, days: daysLeftLabel(days) })),
  };
}
