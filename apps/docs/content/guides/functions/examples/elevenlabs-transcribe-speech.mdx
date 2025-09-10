---
title: Transcription Telegram Bot
subtitle: Build a Telegram bot that transcribes audio and video messages in 99 languages using TypeScript with Deno in Supabase Edge Functions.
tocVideo: 'CE4iPp7kd7Q'
---

## Introduction

In this tutorial you will learn how to build a Telegram bot that transcribes audio and video messages in 99 languages using TypeScript and the ElevenLabs Scribe model via the [speech to text API](https://elevenlabs.io/speech-to-text).

To check out what the end result will look like, you can test out the [t.me/ElevenLabsScribeBot](https://t.me/ElevenLabsScribeBot)

<Admonition type="tip">

Find the [example project on GitHub](https://github.com/elevenlabs/elevenlabs-examples/tree/main/examples/speech-to-text/telegram-transcription-bot).

</Admonition>

## Requirements

- An ElevenLabs account with an [API key](/app/settings/api-keys).
- A [Supabase](https://supabase.com) account (you can sign up for a free account via [database.new](https://database.new)).
- The [Supabase CLI](/docs/guides/local-development) installed on your machine.
- The [Deno runtime](https://docs.deno.com/runtime/getting_started/installation/) installed on your machine and optionally [setup in your favourite IDE](https://docs.deno.com/runtime/getting_started/setup_your_environment).
- A [Telegram](https://telegram.org) account.

## Setup

### Register a Telegram bot

Use the [BotFather](https://t.me/BotFather) to create a new Telegram bot. Run the `/newbot` command and follow the instructions to create a new bot. At the end, you will receive your secret bot token. Note it down securely for the next step.

![BotFather](/docs/img/guides/functions/elevenlabs/bot-father.png)

### Create a Supabase project locally

After installing the [Supabase CLI](/docs/guides/local-development), run the following command to create a new Supabase project locally:

```bash
supabase init
```

### Create a database table to log the transcription results

Next, create a new database table to log the transcription results:

```bash
supabase migrations new init
```

This will create a new migration file in the `supabase/migrations` directory. Open the file and add the following SQL:

```sql supabase/migrations/init.sql
CREATE TABLE IF NOT EXISTS transcription_logs (
  id BIGSERIAL PRIMARY KEY,
  file_type VARCHAR NOT NULL,
  duration INTEGER NOT NULL,
  chat_id BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  username VARCHAR,
  transcript TEXT,
  language_code VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  error TEXT
);

ALTER TABLE transcription_logs ENABLE ROW LEVEL SECURITY;
```

### Create a Supabase Edge Function to handle Telegram webhook requests

Next, create a new Edge Function to handle Telegram webhook requests:

```bash
supabase functions new scribe-bot
```

If you're using VS Code or Cursor, select `y` when the CLI prompts "Generate VS Code settings for Deno? [y/N]"!

### Set up the environment variables

Within the `supabase/functions` directory, create a new `.env` file and add the following variables:

```env supabase/functions/.env
# Find / create an API key at https://elevenlabs.io/app/settings/api-keys
ELEVENLABS_API_KEY=your_api_key

# The bot token you received from the BotFather.
TELEGRAM_BOT_TOKEN=your_bot_token

# A random secret chosen by you to secure the function.
FUNCTION_SECRET=random_secret
```

### Dependencies

The project uses a couple of dependencies:

- The open-source [grammY Framework](https://grammy.dev/) to handle the Telegram webhook requests.
- The [@supabase/supabase-js](/docs/reference/javascript) library to interact with the Supabase database.
- The ElevenLabs [JavaScript SDK](/docs/quickstart) to interact with the speech-to-text API.

Since Supabase Edge Function uses the [Deno runtime](https://deno.land/), you don't need to install the dependencies, rather you can [import](https://docs.deno.com/examples/npm/) them via the `npm:` prefix.

## Code the Telegram bot

In your newly created `scribe-bot/index.ts` file, add the following code:

```ts supabase/functions/scribe-bot/index.ts
import { Bot, webhookCallback } from 'https://deno.land/x/grammy@v1.34.0/mod.ts'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { ElevenLabsClient } from 'npm:elevenlabs@1.50.5'

console.log(`Function "elevenlabs-scribe-bot" up and running!`)

const elevenLabsClient = new ElevenLabsClient({
  apiKey: Deno.env.get('ELEVENLABS_API_KEY') || '',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

async function scribe({
  fileURL,
  fileType,
  duration,
  chatId,
  messageId,
  username,
}: {
  fileURL: string
  fileType: string
  duration: number
  chatId: number
  messageId: number
  username: string
}) {
  let transcript: string | null = null
  let languageCode: string | null = null
  let errorMsg: string | null = null
  try {
    const sourceFileArrayBuffer = await fetch(fileURL).then((res) => res.arrayBuffer())
    const sourceBlob = new Blob([sourceFileArrayBuffer], {
      type: fileType,
    })

    const scribeResult = await elevenLabsClient.speechToText.convert({
      file: sourceBlob,
      model_id: 'scribe_v1',
      tag_audio_events: false,
    })

    transcript = scribeResult.text
    languageCode = scribeResult.language_code

    // Reply to the user with the transcript
    await bot.api.sendMessage(chatId, transcript, {
      reply_parameters: { message_id: messageId },
    })
  } catch (error) {
    errorMsg = error.message
    console.log(errorMsg)
    await bot.api.sendMessage(chatId, 'Sorry, there was an error. Please try again.', {
      reply_parameters: { message_id: messageId },
    })
  }
  // Write log to Supabase.
  const logLine = {
    file_type: fileType,
    duration,
    chat_id: chatId,
    message_id: messageId,
    username,
    language_code: languageCode,
    error: errorMsg,
  }
  console.log({ logLine })
  await supabase.from('transcription_logs').insert({ ...logLine, transcript })
}

const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
const bot = new Bot(telegramBotToken || '')
const startMessage = `Welcome to the ElevenLabs Scribe Bot\\! I can transcribe speech in 99 languages with super high accuracy\\!
    \nTry it out by sending or forwarding me a voice message, video, or audio file\\!
    \n[Learn more about Scribe](https://elevenlabs.io/speech-to-text) or [build your own bot](https://elevenlabs.io/docs/cookbooks/speech-to-text/telegram-bot)\\!
  `
bot.command('start', (ctx) => ctx.reply(startMessage.trim(), { parse_mode: 'MarkdownV2' }))

bot.on([':voice', ':audio', ':video'], async (ctx) => {
  try {
    const file = await ctx.getFile()
    const fileURL = `https://api.telegram.org/file/bot${telegramBotToken}/${file.file_path}`
    const fileMeta = ctx.message?.video ?? ctx.message?.voice ?? ctx.message?.audio

    if (!fileMeta) {
      return ctx.reply('No video|audio|voice metadata found. Please try again.')
    }

    // Run the transcription in the background.
    EdgeRuntime.waitUntil(
      scribe({
        fileURL,
        fileType: fileMeta.mime_type!,
        duration: fileMeta.duration,
        chatId: ctx.chat.id,
        messageId: ctx.message?.message_id!,
        username: ctx.from?.username || '',
      })
    )

    // Reply to the user immediately to let them know we received their file.
    return ctx.reply('Received. Scribing...')
  } catch (error) {
    console.error(error)
    return ctx.reply(
      'Sorry, there was an error getting the file. Please try again with a smaller file!'
    )
  }
})

const handleUpdate = webhookCallback(bot, 'std/http')

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    if (url.searchParams.get('secret') !== Deno.env.get('FUNCTION_SECRET')) {
      return new Response('not allowed', { status: 405 })
    }

    return await handleUpdate(req)
  } catch (err) {
    console.error(err)
  }
})
```

## Deploy to Supabase

If you haven't already, create a new Supabase account at [database.new](https://database.new) and link the local project to your Supabase account:

```bash
supabase link
```

### Apply the database migrations

Run the following command to apply the database migrations from the `supabase/migrations` directory:

```bash
supabase db push
```

Navigate to the [table editor](/dashboard/project/_/editor) in your Supabase dashboard and you should see and empty `transcription_logs` table.

![Empty table](/docs/img/guides/functions/elevenlabs/supa-empty-table.png)

Lastly, run the following command to deploy the Edge Function:

```bash
supabase functions deploy --no-verify-jwt scribe-bot
```

Navigate to the [Edge Functions view](/dashboard/project/_/functions) in your Supabase dashboard and you should see the `scribe-bot` function deployed. Make a note of the function URL as you'll need it later, it should look something like `https://<project-ref>.functions.supabase.co/scribe-bot`.

![Edge Function deployed](/docs/img/guides/functions/elevenlabs/supa-edge-function-deployed.png)

### Set up the webhook

Set your bot's webhook URL to `https://<PROJECT_REFERENCE>.functions.supabase.co/telegram-bot` (Replacing `<...>` with respective values). In order to do that, run a GET request to the following URL (in your browser, for example):

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<PROJECT_REFERENCE>.supabase.co/functions/v1/scribe-bot?secret=<FUNCTION_SECRET>
```

Note that the `FUNCTION_SECRET` is the secret you set in your `.env` file.

![Set webhook](/docs/img/guides/functions/elevenlabs/set-webhook.png)

### Set the function secrets

Now that you have all your secrets set locally, you can run the following command to set the secrets in your Supabase project:

```bash
supabase secrets set --env-file supabase/functions/.env
```

## Test the bot

Finally you can test the bot by sending it a voice message, audio or video file.

![Test the bot](/docs/img/guides/functions/elevenlabs/test-bot.png)

After you see the transcript as a reply, navigate back to your table editor in the Supabase dashboard and you should see a new row in your `transcription_logs` table.

![New row in table](/docs/img/guides/functions/elevenlabs/supa-new-row.png)
