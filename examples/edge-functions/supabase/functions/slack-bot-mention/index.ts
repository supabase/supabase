import { WebClient } from 'https://deno.land/x/slack_web_api@6.7.2/mod.js'
import { withSupabase } from 'npm:@supabase/server@^1'

const slackBotToken = Deno.env.get('SLACK_TOKEN') ?? ''
const botClient = new WebClient(slackBotToken)

console.log(`Slack URL verification function up and running!`)

// Public endpoint, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    try {
      // Implement your Slack request signature verification here before trusting the payload
      // (validate `x-slack-signature` / `x-slack-request-timestamp` with your signing secret).
      const { token, challenge, type, event } = await req.json()

      if (type == 'url_verification') {
        return Response.json({ challenge })
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
      return Response.json({ error: error.message }, { status: 500 })
    }
  }),
}
