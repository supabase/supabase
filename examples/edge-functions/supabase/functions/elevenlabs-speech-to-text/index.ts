// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { Bot, webhookCallback } from 'npm:grammy@^1'
import { withSupabase } from 'npm:@supabase/server@^1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2'
import { ElevenLabsClient } from 'npm:elevenlabs@^1'

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void
}

console.log(`Function "elevenlabs-scribe-bot" up and running!`)

const elevenLabsClient = new ElevenLabsClient({
  apiKey: Deno.env.get('ELEVENLABS_API_KEY') || '',
})

async function scribe({
  bot,
  fileURL,
  fileType,
  duration,
  chatId,
  messageId,
  username,
  supabaseAdmin,
}: {
  bot: Bot
  fileURL: string
  fileType: string
  duration: number
  chatId: number
  messageId: number
  username: string
  supabaseAdmin: SupabaseClient
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
    // console.log({ scribeResult });
    transcript = scribeResult.text
    languageCode = scribeResult.language_code

    // Reply to the user with the transcript
    await bot.api.sendMessage(chatId, transcript, {
      reply_parameters: { message_id: messageId },
    })
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : 'Unknown error'
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
  await supabaseAdmin.from('transcription_logs').insert({ ...logLine, transcript })
}

// Use beforeunload event handler to be notified when function is about to shutdown
addEventListener('beforeunload', (ev) => {
  const reason = (ev as Event & { detail?: { reason?: string } }).detail?.reason
  console.log('Function will be shutdown due to', reason)

  // save state or log the current progress
})

const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
const startMessage = `Welcome to the ElevenLabs Scribe Bot\\! I can transcribe speech in 80\\+ languages with super high accuracy\\!
    \nTry it out by sending or forwarding me a voice message, video, or audio file\\!
    \n[Learn more about Scribe](https://elevenlabs.io/speech-to-text) or [build your own bot](https://elevenlabs.io/docs/cookbooks/speech-to-text/telegram-bot)\\!
  `

// Deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    const bot = new Bot(telegramBotToken || '')
    const supabaseAdmin = ctx.supabaseAdmin

    bot.command('start', (ctx) => ctx.reply(startMessage.trim(), { parse_mode: 'MarkdownV2' }))
    bot.on([':voice', ':audio', ':video'], async (ctx) => {
      try {
        // console.log(ctx);
        const file = await ctx.getFile()
        const fileURL = `https://api.telegram.org/file/bot${telegramBotToken}/${file.file_path}`
        const fileMeta = ctx.message?.video ?? ctx.message?.voice ?? ctx.message?.audio
        // console.log({ fileURL, fileMeta });
        if (!fileMeta) {
          return ctx.reply('No video|audio|voice metadata found. Please try again.')
        }

        // Run the transcription in the background.
        EdgeRuntime.waitUntil(
          scribe({
            bot,
            fileURL,
            fileType: fileMeta.mime_type!,
            duration: fileMeta.duration,
            chatId: ctx.chat.id,
            messageId: ctx.message?.message_id!,
            username: ctx.from?.username || '',
            supabaseAdmin,
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

    try {
      const url = new URL(req.url)
      if (url.searchParams.get('secret') !== Deno.env.get('FUNCTION_SECRET')) {
        return new Response('not allowed', { status: 405 })
      }

      return await handleUpdate(req)
    } catch (err) {
      console.error(err)
      return new Response('Internal Server Error', { status: 500 })
    }
  }),
}
