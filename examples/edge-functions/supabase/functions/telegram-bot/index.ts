// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts"

console.log(`Function "telegram-bot" up and running!`)

import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";

const bot = new Bot(Deno.env.get('TELEGRAM_BOT_TOKEN') || ''); 

bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.command('ping', (ctx) => ctx.reply(`Pong! ${new Date()} ${Date.now()}`))

const handleUpdate = webhookCallback(bot, "std/http");

serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get('secret') !== Deno.env.get('FUNCTION_SECRET')) 
      return new Response('not allowed', { status: 405 })

    return await handleUpdate(req);
  } catch (err) {
    console.error(err);
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
