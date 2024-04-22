// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { Webhook } from "npm:standardwebhooks"
import { readAll } from "https://deno.land/std/io/read_all.ts";
import { Twilio } from "https://cdn.skypack.dev/twilio";
import * as base64 from "https://denopkg.com/chiefbiiko/base64/mod.ts";



const accountSid: string | undefined = Deno.env.get("TWILIO_ACCOUNT_SID");
const authToken: string | undefined = Deno.env.get("TWILIO_AUTH_TOKEN");
const fromNumber: string = Deno.env.get("TWILIO_PHONE_NUMBER")
const toNumber: string = Deno.env.get("TWILIO_TO_NUMBER")
const APP_HASH = Deno.env.get("APP_HASH")



const sendTextMessage = async (
  messageBody: string,
  accountSid: string | undefined,
  authToken: string | undefined,
  fromNumber: string,
  toNumber: string,
): Promise<any> => {
  if (!accountSid || !authToken) {
    console.log(
      "Your Twilio account credentials are missing. Please add them.",
    );
    return;
  }
  const url: string =
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const encodedCredentials: string = base64.fromUint8Array(
    new TextEncoder().encode(`${accountSid}:${authToken}`),
  );
  const body: URLSearchParams = new URLSearchParams({
    To: toNumber,
    From: fromNumber,
    // Uncomment when testing with a fixed number
    // Body: '<your_phone_number>'
    Body: messageBody,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${encodedCredentials}`,
    },
    body,
  });
  return response.json();
};


Deno.serve(async (req) => {
  const payload = await req.text()
  const base64_secret = Deno.env.get('SEND_SMS_HOOK_SECRET')
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(base64_secret);
  try {
    const { user_id, phone, otp } = wh.verify(payload, headers);
    const messageBody = `Your OTP is: ${otp} <#> Your code: ${APP_HASH}`;
    const response = await sendTextMessage(
      messageBody,
      accountSid,
      authToken,
      fromNumber,
      toNumber,
    );
    return new Response(JSON.stringify({
       message: "SMS sent successfully."
     }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
        return new Response(JSON.stringify({
            error: `Failed to process the request: ${error}`
        }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return Response.json(
      data,
  )
})

/* To invoke locally:

   1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
   2. Make an HTTP request:

   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sms_sender' \
   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
   --header 'Content-Type: application/json' \
   --data '{"name":"Functions"}'

 */
