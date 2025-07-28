## ElevenLabs Scribe Telegram Bot

This is a Telegram bot that uses the ElevenLabs API to transcribe voice messages, as well as audio and video files.

You can find the bot here: https://t.me/ElevenLabsScribeBot

For a detailed tutorial, please see the [ElevenLabs Developer Docs](https://elevenlabs.io/docs/cookbooks/speech-to-text/telegram-bot).

## Requirements

- An ElevenLabs account with an [API key](/app/settings/api-keys).
- A [Supabase](https://supabase.com) account (you can sign up for a free account via [database.new](https://database.new)).
- The [Supabase CLI](https://supabase.com/docs/guides/local-development) installed on your machine.
- The [Deno runtime](https://docs.deno.com/runtime/getting_started/installation/) installed on your machine and optionally [setup in your facourite IDE](https://docs.deno.com/runtime/getting_started/setup_your_environment).
- A [Telegram](https://telegram.org) account.

## Setup

### Register the Telegram bot

Next, use [the BotFather](https://t.me/BotFather) to create a new Telegram bot. Run the `/newbot` command and follow the instructions to create a new bot. At the end, you will receive your secret bot token. Note it down securely for the next step.

![BotFather](/assets/images/cookbooks/scribe/telegram-bot/bot-father.png)

### Set up the environment variables

- `cp supabase/functions/.env.example supabase/functions/.env`
- Update the `.env` file with your values.

## Test locally

- `supabase start`
- `supabase functions serve --no-verify-jwt --env-file supabase/functions/.env`
- In another terminal use [ngrok](https://ngrok.com/) to tunnel webhooks to the local server: `ngrok http 54321`
- Set the bot's webhook url to the ngrok url: `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<NGROK_URL>/functions/v1/elevenlabs-speech-to-text?secret=<FUNCTION_SECRET>`

Note: For background tasks to work locally, you need to set the `per_worker` policy in the [`supabase/config.toml`](./supabase/config.toml) file.

```
[edge_runtime]
enabled = true
policy = "per_worker"
```

## Deploy

1. Run `supabase link` and link your local project to your Supabase account.
2. Run `supabase db push` to push the [setup migration](./supabase/migrations/20250203045928_init.sql) to your Supabase database.
3. Run `supabase functions deploy --no-verify-jwt elevenlabs-speech-to-text`
4. Run `supabase secrets set --env-file supabase/functions/.env`
5. Set your bot's webhook url to `https://<PROJECT_REFERENCE>.functions.supabase.co/telegram-bot` (Replacing `<...>` with respective values). In order to do that, run this url (in your browser, for example): `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<PROJECT_REFERENCE>.supabase.co/functions/v1/elevenlabs-speech-to-text?secret=<FUNCTION_SECRET>`
6. That's it, go ahead and chat with your bot 🤖💬
