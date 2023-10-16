import { serve } from 'https://deno.land/std@0.197.0/http/server.ts';
import { WebClient } from 'https://deno.land/x/slack_web_api@6.7.2/mod.js';


const slack_bot_token = Deno.env.get("SLACK_TOKEN") ?? "";
const bot_client = new WebClient(slack_bot_token);

console.log(`Slack URL verification function up and running!`);
serve(async (req) => {
  try {
    const req_body = await req.json();
    console.log(JSON.stringify(req_body, null, 2));
    const { token, challenge, type, event } = req_body;

    if (type == 'url_verification') {
      return new Response(JSON.stringify({ challenge }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else if (event.type == 'app_mention') {
      const { user, text, channel, ts } = event;
      //Here you should process the text recieved and return a response:
      const response = await bot_client.chat.postMessage({
        channel: channel,
        text: `Hello <@${user}>!`,
        thread_ts: ts,
      });
      if (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      return new Response('ok', { status: 200 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});


