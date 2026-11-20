import { Bot, webhookCallback } from 'npm:grammy@^1'
import { withSupabase } from 'npm:@supabase/server@^1'

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

console.log(`Function "telegram-bot" up and running!`)

const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') || '')

bot.command('start', (ctx) => ctx.reply('Welcome! Up and running.'))

bot.command('ping', (ctx) => ctx.reply(`Pong! ${new Date()} ${Date.now()}`))

const handleUpdate = webhookCallback(bot, 'std/http')

// Telegram is verified via the secret query param, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req) => {
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
