import { Bot, Context, InlineKeyboard } from "grammy";
import { Env as KitEnv, PRO_STARS, ProSpec, displayName, isPrivate, makeFetch, now, preparedShare, sendInvoice, wirePro } from "./kit.ts";
import { GuestReply, queryText, wireGuest, wireInline } from "./guest.ts";
import { Store, BirthdayRow, GroupRow } from "./db.ts";
import {
  buildGuestReply, canAddMember, daysLeftLabel, daysUntil, decodeChatId, encodeChatId, greetingText,
  isDueToday, isDueTomorrow, isRealSender, isSourcePayload, localDate, localHour, parseBday, parseTz,
  shouldMarkGreeted,
} from "./logic.ts";
import { APP_HTML, buildShareText, handleProLink, initDataFailure, validateInitData } from "./webapp.ts";
import type { ProLinkBody } from "./webapp.ts";
import { isQaId } from "./webapp-i18n.ts";
import type { ProPlan } from "./webapp-i18n.ts";
import { BOT, publicLink } from "./botname.ts";
import { resolveLang, t } from "./i18n.ts";
export { Store };

const FREE_BIRTHDAYS = 25;
interface Env extends KitEnv { STORE: DurableObjectNamespace<Store>; }
const store = (env: Env) => env.STORE.get(env.STORE.idFromName("main"));

const PRO: ProSpec = {
  title: `${BOT} Pro (this group)`,
  description: "Unlimited birthdays, custom greeting and a day-before DM for one group. One-time payment, no subscription.",
  payload: "bday-pro",
  thanks: "✅ Pro unlocked for the group. Unlimited birthdays, custom greeting and day-before DMs.\n\n/more — more free tools",
};
const helpText = (lang: string): string => t(lang, "help", { free: FREE_BIRTHDAYS, stars: PRO_STARS });
const startText = (lang: string): string => t(lang, "start", { free: FREE_BIRTHDAYS, stars: PRO_STARS });
// Cross-sell list: every other entry is a different maker's bot with its own botname.ts, so
// only THIS bot's own line may ever use the BOT constant — never a literal username here.
const MORE_TEXT = `More free tools by the same maker:\n🔒 @WhisperLockBot — locked messages only one person can open\n⏰ @NudgeRemindBot — reminders that arrive on time\n📮 @AnonInboxProBot — anonymous inbox via your link\n🧾 @SplitTabsBot — split group expenses\n🎂 @${BOT} — never forget a group birthday`;
const SHARE_PITCH = "Never miss a group birthday again — reminders and greetings right in the chat.";
const shareUrl = () => `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/${BOT}?start=share`)}&text=${encodeURIComponent(SHARE_PITCH)}`;
const proKb = (chatId: number, lang: string): InlineKeyboard =>
  new InlineKeyboard().url(t(lang, "btn_unlockProStars", { stars: PRO_STARS }), `https://t.me/${BOT}?start=pro_${encodeChatId(chatId)}`);

async function isGroupAdmin(ctx: Context, chatId: number, userId: number): Promise<boolean> {
  try {
    const m = await ctx.api.getChatMember(chatId, userId);
    return m.status === "creator" || m.status === "administrator";
  } catch { return false; }
}

async function onBday(ctx: Context, env: Env): Promise<void> {
  const from = ctx.from, chat = ctx.chat;
  if (!from || !chat) return;
  const lang = resolveLang(from.language_code);
  if (isPrivate(ctx)) { await ctx.reply(t(lang, "addPrivateNudge") + "\n\n" + helpText(lang), { parse_mode: "Markdown" }); return; }
  const p = parseBday(String(ctx.match ?? ""));
  if (!p) { await ctx.reply("Usage: /bday 14-03  or  /bday 14-03-1990"); return; }
  await store(env).touchGroup(chat.id, "title" in chat ? chat.title ?? "" : "");
  await store(env).touchMember(chat.id, from.id);
  const g = await store(env).group(chat.id);
  const isNew = !(await store(env).hasBirthday(chat.id, from.id));
  if (isNew && !canAddMember(await store(env).countBirthdays(chat.id), (g?.pro ?? 0) === 1, FREE_BIRTHDAYS)) {
    await store(env).track(from.id, "pro_prompt");
    await ctx.reply(t(lang, "limitReached", { free: FREE_BIRTHDAYS, stars: PRO_STARS }), { reply_markup: proKb(chat.id, lang) });
    return;
  }
  await store(env).track(from.id, "action");
  await store(env).upsertBirthday(chat.id, from.id, displayName(from), p.day, p.month, p.year);
  const when = String(p.day).padStart(2, "0") + "-" + String(p.month).padStart(2, "0") + (p.year ? "-" + p.year : "");
  await ctx.reply(`🎂 Got it, ${displayName(from)} — ${when}.`);
}

async function onUpcoming(ctx: Context, env: Env): Promise<void> {
  const from = ctx.from, chat = ctx.chat;
  if (!from || !chat) return;
  const lang = resolveLang(from.language_code);
  if (isPrivate(ctx)) { await ctx.reply(t(lang, "addPrivateNudge") + "\n\n" + helpText(lang), { parse_mode: "Markdown" }); return; }
  await store(env).touchMember(chat.id, from.id);
  const g = await store(env).group(chat.id);
  const rows = await store(env).birthdaysOf(chat.id);
  const today = localDate(now(), g?.tz_min ?? 0);
  const withDays = rows.map((b) => ({ name: b.name, left: daysUntil(b, today) })).sort((a, b) => a.left - b.left).slice(0, 10);
  if (!withDays.length) { await ctx.reply("No birthdays saved yet. /bday 14-03"); return; }
  await ctx.reply("🎂 Upcoming birthdays\n" + withDays.map((r) => `${r.name} — ${daysLeftLabel(r.left)}`).join("\n"));
}

async function onGtz(ctx: Context, env: Env): Promise<void> {
  const from = ctx.from, chat = ctx.chat;
  if (!from || !chat) return;
  const lang = resolveLang(from.language_code);
  if (isPrivate(ctx)) { await ctx.reply(t(lang, "addPrivateNudge") + "\n\n" + helpText(lang), { parse_mode: "Markdown" }); return; }
  const tz = parseTz(String(ctx.match ?? ""));
  if (tz === null) { await ctx.reply("Usage: /gtz +2  or  /gtz -5:30"); return; }
  const g = await store(env).touchGroup(chat.id, "title" in chat ? chat.title ?? "" : "");
  if (g.tz_set === 1 && !(await isGroupAdmin(ctx, chat.id, from.id))) {
    await ctx.reply(t(resolveLang(from.language_code), "gtzAdminOnly"));
    return;
  }
  await store(env).setGroupTz(chat.id, tz);
  await ctx.reply("🕒 Group timezone saved.");
}

async function onGreeting(ctx: Context, env: Env): Promise<void> {
  const from = ctx.from, chat = ctx.chat;
  if (!from || !chat) return;
  const lang = resolveLang(from.language_code);
  if (isPrivate(ctx)) { await ctx.reply(t(lang, "addPrivateNudge") + "\n\n" + helpText(lang), { parse_mode: "Markdown" }); return; }
  const g = await store(env).touchGroup(chat.id, "title" in chat ? chat.title ?? "" : "");
  if (g.pro !== 1) {
    await store(env).track(from.id, "pro_prompt");
    await ctx.reply(t(lang, "greetingProOnly"), { reply_markup: proKb(chat.id, lang) });
    return;
  }
  const text = String(ctx.match ?? "").trim().slice(0, 200);
  if (!text) { await ctx.reply("Usage: /greeting Happy birthday {name}! 🎉"); return; }
  await store(env).setGreeting(chat.id, text);
  await ctx.reply("✅ Custom greeting saved.");
}

/** For every group with >=1 stored birthday whose local hour is 9: greets everyone whose
 * birthday falls today (not yet greeted this local year), and — Pro groups only — DMs
 * "started the bot" members about anyone whose birthday is tomorrow. Bounded to 5000 groups
 * and 200 DMs per birthday per run. `last_greeted_year` is stamped only after a successful
 * send (P0-5) so a transient failure stays retryable next hour instead of being silently
 * lost for a year, and each group runs in its own try/catch (P0-6) so one bad chat can't
 * abort every remaining group's greeting for this tick. */
async function greet(env: Env): Promise<{ greeted: number; dms: number }> {
  const bot = new Bot(env.BOT_TOKEN);
  const nowSec = now();
  const groups = await store(env).groupsWithBirthdays();
  let greeted = 0, dms = 0;
  for (const g of groups) {
    // P0-6: one group's throw (a bad chat, a store error) must not abort every remaining
    // group's greeting for this tick — each group gets its own try/catch.
    try {
      if (localHour(nowSec, g.tz_min) !== 9) continue;
      const today = localDate(nowSec, g.tz_min);
      const rows = await store(env).birthdaysOf(g.chat_id);
      for (const b of rows) {
        if (isDueToday(b, today, b.last_greeted_year)) { greeted += await greetOne(bot, env, g, b); }
        if (g.pro === 1 && isDueTomorrow(b, today, b.last_dm_year)) { dms += await dmOne(bot, env, g, b); }
      }
    } catch (e) { console.log("greet: group failed", g.chat_id, String(e).slice(0, 100)); }
  }
  return { greeted, dms };
}

async function greetOne(bot: Bot, env: Env, g: GroupRow, b: BirthdayRow): Promise<number> {
  const text = g.pro === 1 ? greetingText(b.name, g.greeting) : greetingText(b.name);
  let sent = 0;
  try {
    await bot.api.sendMessage(g.chat_id, text);
    sent = 1;
    await store(env).incr("greetings_sent");
  } catch (e) { console.log("greet failed", g.chat_id, String(e).slice(0, 100)); }
  // P0-5: only a send that actually succeeded may stamp last_greeted_year — a failed send
  // stays retryable next hour instead of being silently lost for a full year.
  if (shouldMarkGreeted(sent === 1)) await store(env).markGreeted(g.chat_id, b.user_id, localDate(now(), g.tz_min).year);
  return sent;
}

async function dmOne(bot: Bot, env: Env, g: GroupRow, b: BirthdayRow): Promise<number> {
  const members = await store(env).dmableMembers(g.chat_id, b.user_id);
  let sent = 0;
  for (const uid of members.slice(0, 200)) {
    try { await bot.api.sendMessage(uid, `🎂 Tomorrow is ${b.name}'s birthday.`); sent += 1; await store(env).incr("dm_reminders"); }
    catch { /* never started the bot, or blocked it */ }
  }
  await store(env).markDm(g.chat_id, b.user_id, localDate(now(), g.tz_min).year);
  return sent;
}

async function onStart(ctx: Context, env: Env): Promise<void> {
  const from = ctx.from;
  if (!from) return;
  const isNewUser = (await store(env).getUser(from.id)) === null;
  await store(env).touchUser(from.id, from.username, displayName(from));
  await store(env).track(from.id, "start");
  const lang = resolveLang(from.language_code);
  const payload = String(ctx.match ?? "");
  const pm = payload.match(/^pro_(m?\d+)$/);
  if (pm && isPrivate(ctx)) {
    const chatId = decodeChatId(pm[1]);
    if (chatId !== null) {
      const spec: ProSpec = { ...PRO, description: t(lang, "proDescription") };
      await sendInvoice(ctx, spec, "bday-pro:" + chatId, (s) => store(env).track(from.id, s));
      return;
    }
  }
  if (isPrivate(ctx)) await store(env).markStarted(from.id);
  // Only a genuinely new user counts as an acquisition; a returning user tapping a share
  // link again must not inflate src_* counts.
  if (isSourcePayload(payload) && isNewUser) await store(env).addSource(from.id, payload);
  const kb = new InlineKeyboard().url(t(lang, "btn_addToGroup"), `https://t.me/${BOT}?startgroup=true`).row().url(t(lang, "btn_shareBot"), shareUrl());
  await ctx.reply(startText(lang), { parse_mode: "Markdown", reply_markup: kb });
}

/** Guest Mode: someone @-mentioned BirthdayBot in a chat it was never added to. Answers
 * with a days-until preview when the date parses (UTC "today" — a guest has no group
 * timezone); the localized /start pitch otherwise. */
async function onGuest(ctx: Context): Promise<GuestReply> {
  const lang = resolveLang(ctx.from?.language_code);
  const q = queryText(ctx, BOT);
  return buildGuestReply(q, lang, FREE_BIRTHDAYS, PRO_STARS, localDate(now(), 0), BOT);
}

function buildBot(env: Env): Bot {
  const bot = new Bot(env.BOT_TOKEN);
  // Registered first, on the RAW bot, before the `m` composer below even exists: grammY's
  // .command() matches a channel_post as well as a message (ctx.message ?? ctx.channelPost),
  // and a composer branch installed by .filter() runs at the position where .filter() was
  // called — so placing this after `m` would let m's own message:text fallback (for a real
  // sender) or kit's unfiltered bot.command("pro") (for a channel post / anonymous admin,
  // which never reaches `m`'s isRealSender filter) intercept /pro first. Being first here
  // means this always wins, and kit's own bot.command("pro") (wired below) never runs.
  bot.command("pro", async (ctx) => {
    if (!isRealSender(ctx.from?.id, ctx.message?.via_bot, ctx.message?.sender_chat)) return;
    const lang = resolveLang(ctx.from?.language_code);
    if (isPrivate(ctx)) { await ctx.reply(t(lang, "proRunInGroup")); return; }
    await ctx.reply(t(lang, "proGroupInfo", { stars: PRO_STARS }), { reply_markup: proKb(ctx.chat!.id, lang) });
  });
  // Real-sender guard: only real messages (never channel posts), never the anonymous-admin
  // pseudo-user, never a message relayed via another bot's inline result.
  const m = bot.on("message").filter((ctx) => isRealSender(ctx.from?.id, ctx.message.via_bot, ctx.message.sender_chat));
  m.command("more", (ctx) => ctx.reply(MORE_TEXT));
  m.command("start", (ctx) => onStart(ctx, env));
  m.command("help", (ctx) => ctx.reply(helpText(resolveLang(ctx.from?.language_code)), { parse_mode: "Markdown" }));
  m.command("bday", (ctx) => onBday(ctx, env));
  m.command("upcoming", (ctx) => onUpcoming(ctx, env));
  m.command("gtz", (ctx) => onGtz(ctx, env));
  m.command("greeting", (ctx) => onGreeting(ctx, env));
  // wirePro's own bot.command("pro") is shadowed by the one registered at the top of this
  // function (see the comment there) — it's kept here only for its pre_checkout_query and
  // message:successful_payment handlers.
  wirePro(bot, PRO, async (ctx, payload, charge) => {
    const from = ctx.from;
    if (!from) return;
    const pm = payload.match(/^bday-pro:(-?\d+)$/);
    if (pm) await store(env).setGroupPro(Number(pm[1]), charge); else await store(env).setPro(from.id, charge);
    // kit.ts always sends its own (English) spec.thanks after onPaid resolves; for a
    // non-English payer we send a localized thank-you first so they get at least one
    // message in their language.
    const lang = resolveLang(from.language_code);
    if (lang !== "en") await ctx.reply(t(lang, "thankYou"));
  }, (uid, s) => store(env).track(uid, s), true);
  bot.on("message:new_chat_members", (ctx) => {
    if (!ctx.message.new_chat_members.some((mem) => mem.id === ctx.me.id)) return;
    return ctx.reply(startText(resolveLang(ctx.from?.language_code)), { parse_mode: "Markdown" });
  });
  // Help fallback: private chats only, registered after the payment handlers above.
  m.on("message:text", async (ctx) => {
    // Group chatter: keep the Mini App's group list warm, but only touch storage on every
    // 20th message — a chatty group otherwise pays a sustained DO write per message for no
    // functional benefit (the touch is just freshness, not correctness-critical).
    if (!isPrivate(ctx)) {
      if (ctx.message.message_id % 20 === 0) {
        await store(env).touchGroup(ctx.chat.id, ctx.chat.title ?? "");
        await store(env).touchMember(ctx.chat.id, ctx.from.id);
      }
      return;
    }
    await ctx.reply(helpText(resolveLang(ctx.from.language_code)), { parse_mode: "Markdown" });
  });
  wireGuest(bot, {
    botUsername: BOT,
    reply: (ctx) => onGuest(ctx),
    // `guest` is NOT written to `sources` here (REVIEW-GUEST F3): a summoner is not an
    // installer. src_guest is earned later, through the ?start=guest deep link in the
    // buttons below. recordGuest self-limits; `flood` downgrades us to the cheap pitch.
    record: async (uid, chatType, chatId) => {
      const r = await store(env).recordGuest(uid, chatType, chatId);
      if (r.recorded) await store(env).track(uid, "guest");
      return !r.flood;
    },
  });
  // Classic inline mode: the SAME reply builder, answered as an inline result. A user types
  // "@Bot query" in any chat on any client and posts the card with `via @Bot` attribution —
  // no admin, no membership, no Guest Chat Mode toggle. The destination chat is unknown, so
  // the card carries private-style buttons only. Counted under `inline_queries`; `sources` is
  // never written here (an inline user is not an installer, same rule as the guest path).
  wireInline(bot, {
    botUsername: BOT,
    reply: (ctx) => onGuest(ctx),
    record: async (uid) => !(await store(env).recordInline(uid)).flood,
    chosen: (uid) => store(env).recordInlineChosen(uid),
  });
  return bot;
}

async function api(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json(initDataFailure(body.initData ?? "", publicLink()), { status: 401 });
  const groups = [];
  for (const gr of (await store(env).groupsOf(user.id)).slice(0, 20)) {
    const g = await store(env).group(gr.chat_id);
    const today = localDate(now(), g?.tz_min ?? 0);
    const rows = await store(env).birthdaysOf(gr.chat_id);
    const upcoming = rows.map((b) => ({ name: b.name, left: daysUntil(b, today) })).sort((a, b) => a.left - b.left).slice(0, 10)
      .map((r) => ({ name: r.name, label: daysLeftLabel(r.left) }));
    groups.push({ chat_id: gr.chat_id, title: gr.title, pro: g?.pro ?? 0, upcoming });
  }
  return Response.json({ groups, proStars: PRO_STARS });
}

/** POST /api/share: registers a Bot API "prepared" inline message (savePreparedInlineMessage)
 * so the Mini App can hand its id to tg.shareMessage(id) for a native chat/group/channel share. */
async function apiShare(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json(initDataFailure(body.initData ?? "", publicLink()), { status: 401 });
  try {
    const share = await preparedShare(env, user.id, buildShareText(SHARE_PITCH, BOT, "shared"), `https://t.me/${BOT}`);
    await store(env).recordShare(user.id, "chat");
    return Response.json(share);
  } catch { return Response.json({ error: "Share unavailable." }, { status: 502 }); }
}

/** POST /api/share-story: records a "share to story" click. Telegram gives no server
 * callback for tg.shareToStory, so the client fires this right before calling it. */
async function apiShareStory(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { initData?: string };
  const user = await validateInitData(body.initData ?? "", [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t));
  if (!user) return Response.json(initDataFailure(body.initData ?? "", publicLink()), { status: 401 });
  await store(env).recordShare(user.id, "story");
  return Response.json({ ok: true });
}

/** POST /api/pro-link: the Mini App's own Stars checkout (tg.openInvoice). Unlike every
 * other bot in the fleet, BirthdayBot's Pro is per-GROUP (`groups.pro`), not per-user — so
 * the request body carries a `chatId` alongside the usual `{initData, plan}`, and the
 * invoice payload must be the SAME "bday-pro:<chatId>" shape the chat flow's /start
 * pro_<encodeChatId> deep link already mints (see onStart above), or successful_payment's
 * `bday-pro:(-?\d+)` match and setGroupPro would never fire. A request with no valid chatId
 * never reaches the Bot API: a QA fixture id short-circuits inside handleProLink before
 * `mint` is ever called, and any other caller without a chatId gets a 400 here rather than
 * risking a bot-wide invoice. */
async function apiProLink(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as ProLinkBody;
  const tokens = [env.BOT_TOKEN, env.HUB_BOT_TOKEN].filter((t): t is string => !!t);
  const chatId = body.chatId;
  const hasChat = typeof chatId === "number" && Number.isFinite(chatId);
  const user = await validateInitData(body.initData ?? "", tokens);
  if (user && !isQaId(user.id) && !hasChat) {
    return Response.json({ error: "chat required" }, { status: 400 });
  }
  const mintForChat = (plan: ProPlan): Promise<string> => {
    if (!hasChat) return Promise.reject(new Error("chat required"));
    return new Bot(env.BOT_TOKEN).api.createInvoiceLink(PRO.title, PRO.description, "bday-pro:" + chatId, "", "XTR", [{ label: PRO.title, amount: PRO_STARS }]);
  };
  return handleProLink(body, {
    tokens,
    botLink: publicLink(),
    allowMonthly: false,
    mint: mintForChat,
    track: (userId) => store(env).track(userId, "invoice"),
  });
}

const botFetch = makeFetch<Env>(buildBot, (env) => store(env).stats());
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const path = new URL(req.url).pathname;
    if (path === "/app") return new Response(APP_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (path === "/api/share" && req.method === "POST") return apiShare(req, env);
    if (path === "/api/share-story" && req.method === "POST") return apiShareStory(req, env);
    if (path === "/api/pro-link" && req.method === "POST") return apiProLink(req, env);
    if (path === "/api/upcoming" && req.method === "POST") return api(req, env);
    return botFetch(req, env);
  },
  async scheduled(_ev: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(greet(env).catch((e) => console.log("greet: scheduled run failed", String(e).slice(0, 200))));
  },
};
