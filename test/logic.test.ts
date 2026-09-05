import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canAddMember, daysUntil, decodeChatId, encodeChatId, isDueToday, isRealSender, isSourcePayload,
  localDate, localHour, parseBday, shouldMarkGreeted,
} from "../src/logic.ts";

test("parseBday: DD-MM", () => {
  assert.deepEqual(parseBday("14-03"), { day: 14, month: 3, year: undefined });
});

test("parseBday: DD-MM-YYYY", () => {
  assert.deepEqual(parseBday("14-03-1990"), { day: 14, month: 3, year: 1990 });
});

test("parseBday: rejects invalid calendar date 31-02", () => {
  assert.equal(parseBday("31-02"), null);
});

test("parseBday: accepts yearless leap day 29-02, rejects it for a non-leap year", () => {
  assert.deepEqual(parseBday("29-02"), { day: 29, month: 2, year: undefined });
  assert.equal(parseBday("29-02-2019"), null);
  assert.deepEqual(parseBday("29-02-2020"), { day: 29, month: 2, year: 2020 });
});

test("parseBday: rejects garbage", () => {
  assert.equal(parseBday("hello"), null);
  assert.equal(parseBday("14/03"), null);
  assert.equal(parseBday("00-03"), null);
  assert.equal(parseBday("14-13"), null);
});

test("daysUntil: same-day is 0, and it wraps across the year boundary", () => {
  assert.equal(daysUntil({ day: 31, month: 12 }, { year: 2026, month: 12, day: 31 }), 0);
  assert.equal(daysUntil({ day: 1, month: 1 }, { year: 2026, month: 12, day: 31 }), 1);
  assert.equal(daysUntil({ day: 1, month: 1 }, { year: 2026, month: 12, day: 30 }), 2);
});

test("greeting dedupe: due today only until marked greeted for this local year", () => {
  const b = { day: 14, month: 3 };
  const today = { year: 2026, month: 3, day: 14 };
  assert.equal(isDueToday(b, today, 0), true); // never greeted
  assert.equal(isDueToday(b, today, 2026), false); // already greeted this year
  assert.equal(isDueToday(b, today, 2025), true); // greeted a prior year, due again
});

test("localHour: selects hour 9 for a group with a positive tz offset", () => {
  // 2026-03-14T07:00:00Z, group at UTC+2 -> local 09:00
  const sec = Date.UTC(2026, 2, 14, 7, 0, 0) / 1000;
  assert.equal(localHour(sec, 120), 9);
  assert.equal(localHour(sec, 0), 7);
});

test("localDate: rolls the calendar day forward across a tz offset", () => {
  // 2026-03-14T23:30:00Z, group at UTC+2 -> local date is the 15th
  const sec = Date.UTC(2026, 2, 14, 23, 30, 0) / 1000;
  assert.deepEqual(localDate(sec, 120), { year: 2026, month: 3, day: 15 });
});

test("canAddMember: free cap at 25, Pro is unlimited", () => {
  assert.equal(canAddMember(24, false, 25), true);
  assert.equal(canAddMember(25, false, 25), false);
  assert.equal(canAddMember(999, true, 25), true);
});

test("deep-link chat-id encode/decode round trip", () => {
  assert.equal(encodeChatId(-1001234567890), "m1001234567890");
  assert.equal(decodeChatId("m1001234567890"), -1001234567890);
  assert.equal(decodeChatId("500"), 500);
  assert.equal(decodeChatId("not-a-number"), null);
});

test("source payload regex accepts short lowercase tags, rejects pro tags and junk", () => {
  assert.equal(isSourcePayload("site"), true);
  assert.equal(isSourcePayload("x"), false); // too short
  assert.equal(isSourcePayload("pro"), false); // reserved
  assert.equal(isSourcePayload("pro_m123"), false);
  assert.equal(isSourcePayload("UPPER"), false);
});

test("isRealSender rejects pseudo-senders, via_bot relays, and channel posts", () => {
  assert.equal(isRealSender(42, undefined, undefined), true);
  assert.equal(isRealSender(1087968824, undefined, undefined), false); // GroupAnonymousBot
  assert.equal(isRealSender(42, { id: 7 }, undefined), false); // via_bot
  assert.equal(isRealSender(42, undefined, { id: -1 }), false); // sender_chat (linked channel)
  assert.equal(isRealSender(undefined, undefined, undefined), false);
});

test("shouldMarkGreeted (P0-5): a failed send must never stamp last_greeted_year", () => {
  assert.equal(shouldMarkGreeted(false), false, "a failed sendMessage stays retryable next hour");
  assert.equal(shouldMarkGreeted(true), true, "a successful send is recorded so it never repeats this year");
});
