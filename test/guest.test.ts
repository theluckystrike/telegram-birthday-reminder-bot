import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGuestResult } from "../src/guest.ts";
import { buildGuestReply } from "../src/logic.ts";

const FREE = 25, STARS = 150;
const TODAY = { year: 2026, month: 9, day: 4 };
const BOT = "BirthdayReminderProBot";

test("a parseable date becomes a days-until value card, not the pitch", () => {
  const r = buildGuestReply("14-03", "en", FREE, STARS, TODAY, BOT);
  assert.match(r.title, /14-03/);
  assert.match(r.text, /14-03/);
  assert.doesNotMatch(r.text, /remembers group birthdays/);
});

test("a birthday today reads \"today\", not \"in 0 days\"", () => {
  const r = buildGuestReply("04-09", "en", FREE, STARS, TODAY, BOT);
  assert.match(r.title, /today/);
});

test("garbage or an empty query falls back to the localized start pitch", () => {
  for (const q of ["", "not a date", "32-13", "  "]) {
    const r = buildGuestReply(q, "en", FREE, STARS, TODAY, BOT);
    assert.equal(r.title, "🎂 BirthdayReminderProBot — never forget a group birthday");
    assert.match(r.text, /Nobody in your group forgets a birthday/);
  }
});

test("both replies are plain text, Markdown stripped", () => {
  for (const q of ["", "14-03"]) {
    const r = buildGuestReply(q, "en", FREE, STARS, TODAY, BOT);
    assert.equal(r.text.includes("*"), false);
    assert.equal(r.text.includes("`"), false);
  }
});

test("the guest result carries no parse_mode and the default buttons", () => {
  for (const q of ["", "14-03"]) {
    const r = buildGuestReply(q, "en", FREE, STARS, TODAY, BOT);
    const res = buildGuestResult(r, BOT, "supergroup");
    assert.equal("parse_mode" in res.input_message_content, false);
    assert.equal(res.reply_markup?.inline_keyboard.length, 2, "Open + Add to this group");
  }
});

test("other locales produce localized, still-plain text", () => {
  const r = buildGuestReply("14-03", "es", FREE, STARS, TODAY, BOT);
  assert.match(r.text, /Faltan/);
  assert.equal(r.text.includes("*"), false);
});

test("buildGuestReply never hardcodes a bot username — the pitch card names whichever botUsername it's given", () => {
  const r = buildGuestReply("", "en", FREE, STARS, TODAY, "SomeOtherBot");
  assert.match(r.title, /SomeOtherBot/);
  assert.doesNotMatch(r.title, /BirthdayReminderProBot/);
});
