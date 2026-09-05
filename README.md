# BirthdayReminderProBot — birthday reminders for Telegram

**Try it:** [@BirthdayReminderProBot](https://t.me/BirthdayReminderProBot?start=github) · [tg.zovo.one/bots/birthday/](https://tg.zovo.one/bots/birthday/)

## What it does

BirthdayReminderProBot keeps a group's birthdays in one place and posts a greeting on the day. Add it to a group; each member saves their own birthday with `/bday 14-03` (or `/bday 14-03-1990` with a year), and `/upcoming` lists the next 10 with days left. `/gtz +2` sets the group's timezone (the first person to run it sets it; after that only an admin can change it), and an hourly cron greets anyone whose birthday is today at 9am the group's local time. Free tier: up to 25 stored birthdays per group, a plain greeting. Pro (one-time 150 ⭐ per group) adds unlimited birthdays, a custom `/greeting` template, and a day-before DM to members who've started the bot privately.

## Use it without adding the bot

Type `@BirthdayReminderProBot 14-03` in **any** Telegram chat, even one the bot has never been added to. When the date parses it replies with a live days-until preview (computed in UTC — a guest has no group timezone to go by); otherwise it answers with the intro pitch.

Both **Inline Mode** and **Guest Chat Mode** need to be turned on for the bot in [@BotFather](https://t.me/BotFather) (Bot Settings → Mode Settings) — turn Inline Mode on first, then Guest Chat Mode. Without both, only the classic `@Bot query` inline surface works.

## Self-host

```bash
pnpm i
wrangler secret put BOT_TOKEN
wrangler secret put WEBHOOK_SECRET
wrangler secret put OWNER_ID # optional
wrangler deploy
curl -G "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  --data-urlencode "url=https://<your-worker>.workers.dev/webhook" \
  --data-urlencode "secret_token=$WEBHOOK_SECRET" \
  --data-urlencode 'allowed_updates=["message","callback_query","guest_message","inline_query","chosen_inline_result"]'
```

## Stack

[grammY](https://grammy.dev/) on Cloudflare Workers, state in a Durable Object backed by SQLite, an hourly Cron Trigger for greetings, Pro upgrades billed with Telegram Stars.

---
Part of Tiny Telegram Tools — https://tg.zovo.one/
