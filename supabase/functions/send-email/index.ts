// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { Webhook } from "npm:standardwebhooks"
import { readAll } from "https://deno.land/std/io/read_all.ts";
import { Twilio } from "https://cdn.skypack.dev/twilio";
import * as base64 from "https://denopkg.com/chiefbiiko/base64/mod.ts";
// Importing fetch API for Deno
// No import needed as Deno includes fetch in its global scope
const postmarkEndpoint = 'https://api.postmarkapp.com/email';

const SUBJECT_SIGNUP_VERIFICATION = 'Confirm Your Email';
const SUBJECT_PASSWORD_RECOVERY = 'Reset Your Password';
const SUBJECT_INVITATION_TO_JOIN = 'You have been invited';
const SUBJECT_MAGIC_LINK_LOGIN = 'Your Magic Link';
const SUBJECT_EMAIL_CHANGE_VERIFICATION = 'Confirm Email Change';
const SUBJECT_REAUTHENTICATION_REQUIRED = 'Confirm reauthentication';


Deno.serve(async (req) => {
  const payload = await req.text()
  const serverToken = Deno.env.get("POSTMARK_SERVER_TOKEN");
  const headers = Object.fromEntries(req.headers)
  const base64_secret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  const wh = new Webhook(base64_secret);
  const { user, email_data } = wh.verify(payload, headers);

  let subject = '';
  let htmlBody = '';

  switch (email_data.email_action_type) {
    case "signup":
      subject = SUBJECT_SIGNUP_VERIFICATION;
      htmlBody = `<h2>Confirm your email</h2><p>Follow this link to confirm your email:</p><p><a href="${email_data.confirmation_url}">Confirm your email address</a></p><p>Alternatively, enter the code: ${email_data.token}</p>`;
      break;
    case "recovery":
      subject = SUBJECT_PASSWORD_RECOVERY;
      htmlBody = `<h2>Reset password</h2><p>Follow this link to reset the password for your user:</p><p><a href="${email_data.confirmation_url}">Reset password</a></p><p>Alternatively, enter the code: ${email_data.token}</p>`;
      break;
    case "invite":
      subject = SUBJECT_INVITATION_TO_JOIN;
      htmlBody = `<h2>You have been invited</h2><p>You have been invited to create a user on ${email_data.site_url}. Follow this link to accept the invite:</p><p><a href="${email_data.confirmation_url}">Accept the invite</a></p><p>Alternatively, enter the code: ${email_data.token}</p>`;
      break;
    case "magiclink":
      subject = SUBJECT_MAGIC_LINK_LOGIN;
      htmlBody = `<h2>Magic Link</h2><p>Follow this link to login:</p><p><a href="${email_data.confirmation_url}">Log In</a></p><p>Alternatively, enter the code: ${email_data.token}</p>`;
      break;
    case "email_change":
    case "email_change_current":
      subject = SUBJECT_EMAIL_CHANGE_VERIFICATION;
      htmlBody = `<h2>Confirm email address change</h2><p>Follow this link to confirm the update of your email address from ${email_data.email} to ${email_data.new_email}:</p><p><a href="${email_data.confirmation_url}">Change email address</a></p><p>Alternatively, enter the code: ${email_data.token}</p>`;
      break;
    case "email_change_new":
      subject = SUBJECT_EMAIL_CHANGE_VERIFICATION;
      htmlBody = `<h2>Confirm email address change</h2><p>Follow this link to confirm the update of your email address from ${email_data.new_email} to ${email_data.email}:</p><p><a href="${email_data.confirmation_url}">Change email address</a></p><p>Alternatively, enter the code: ${email_data.token_new}</p>`;
      break;
    case "email":
      subject = SUBJECT_EMAIL_VERIFICATION;
      htmlBody = `<h2>Confirm your email</h2><p>Follow this link to confirm your email:</p><p><a href="${email_data.confirmation_url}">Confirm your email address</a></p><p>Alternatively, enter the code: ${email_data.token}</p>`;
      break;
    case "reauthentication":
      subject = SUBJECT_REAUTHENTICATION_REQUIRED;
      htmlBody = `<h2>Confirm reauthentication</h2><p>Enter the code: ${email_data.token}</p>`;
      break;
    default:
      return new Response(JSON.stringify({
        error: `Invalid request type: ${email_data.email_action_type}`
      }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  console.log(serverToken)

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Postmark-Server-Token': serverToken
    },
    body: JSON.stringify({
      From: "welcome@supabase.com",
      To: user.email,
      Subject: subject,
      HtmlBody: htmlBody
    })
  };

  try {
    const response = await fetch(postmarkEndpoint, requestOptions);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.Message}`);
    }
    return new Response(JSON.stringify({
      message: "Email sent successfully."
    }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({
      error: `Failed to process the request: ${error.message}`
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

})
/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/email_sender' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
