import { WebClient } from 'npm:@slack/web-api@^7'
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
      const { challenge, type, event } = await req.json()

      if (type == 'url_verification') {
        return Response.json({ challenge })
      } else if (event.type == 'app_mention') {
        const { user, text, channel, ts } = event
        // Here you should process the text received and return a response:
        await botClient.chat.postMessage({
          channel: channel,
          text: `Hello <@${user}>!`,
          thread_ts: ts,
        })
        return new Response('ok', { status: 200 })
      }

      return Response.json({ ok: true })
    } catch (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
  }),
}
