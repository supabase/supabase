---
id: 'slack-bot-mention'
title: 'Slack Bot Mention Edge Function'
description: 'Building a Slack Bot that Handles Mentions.'
---

The Slack Bot Mention Edge Function allows you to process mentions in Slack and respond accordingly.

## Configuring Slack apps

For your bot to seamlessly interact with Slack, you'll need to configure Slack Apps:

1. Navigate to the Slack Apps page.
1. Under "Event Subscriptions," add the URL of the `slack-bot-mention` function and click to verify the URL.
1. The Edge function will respond, confirming that everything is set up correctly.
1. Add `app-mention` in the events the bot will subscribe to.

## Creating the Edge Function

Deploy the following code as an Edge function using the CLI:

```bash
supabase --project-ref nacho_slacker secrets \
set SLACK_TOKEN=<xoxb-0000000000-0000000000-01010101010nacho101010>
```

Here's the code of the Edge Function, you can change the response to handle the text received:

```ts index.ts
import { WebClient } from 'https://deno.land/x/slack_web_api@6.7.2/mod.js'

const slackBotToken = Deno.env.get('SLACK_TOKEN') ?? ''
const botClient = new WebClient(slackBotToken)

console.log(`Slack URL verification function up and running!`)
Deno.serve(async (req) => {
  try {
    const reqBody = await req.json()
    console.log(JSON.stringify(reqBody, null, 2))
    const { token, challenge, type, event } = reqBody

    if (type == 'url_verification') {
      return new Response(JSON.stringify({ challenge }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (event.type == 'app_mention') {
      const { user, text, channel, ts } = event
      // Here you should process the text received and return a response:
      const response = await botClient.chat.postMessage({
        channel: channel,
        text: `Hello <@${user}>!`,
        thread_ts: ts,
      })
      return new Response('ok', { status: 200 })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```
