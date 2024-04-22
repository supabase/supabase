# Supabase Send SMS Auth Hook

Use this Hook to send SMS-es with a custom provider. In this example, we use the hook to append an [AppHash](https://developers.google.com/identity/sms-retriever/verify#computing_your_apps_hash_string) which allows your mobile application to filter SMS-es and OTP codes sent by your application. This allows for autofill of OTP codes withot having to switch to a separate application. 

## Configuration

Copy this folder to your CLI project. In this case, my folder is located at `~/Desktop/auth_hooks/` so I will run:

```bash
cp -r ../send_sms/ ~/Desktop/auth_hooks/supabase/functions/send_sms/`
```

Copy the following environment variables from [the Twilio Console](https://console.twilio.com/) into your `.env.local` file:

```bash
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

```bash
APP_HASH="<YOUR_APP_HASH>"
SEND_SMS_HOOK_SECRET="whsec_<standard_base64_encoded_string>"
```

You can use a [Base64 encoding tool](https://www.base64encode.net/) to help. Note that we use standard Base64 encoding which includes the `+`, `/`, and `=` characters - this is distinct from `Base64URLEncoding` which replaces `+` with `-` and `/` with `_`. Under base64 encoding, a string such as `supabasefunctionsareawesome` would correspond to a secret of `whsec_c3VwYWJhc2VmdW5jdGlvbnNhcmVhd2Vzb21l`

As these are secrets, we don't want to commit these in code lest we push the secrets to a public repository.

## Usage 

### Standalone Function

```bash
cat .env.example >> ./functions/.env.local
```

Test the function with the following curl request:

Set the destination URL to: `https://127.0.0.1:54321/functions/v1/<your_function_name>` and set the payload to take the shape:

```
{
  "user_id": "REPLACE_WITH_UUID",  // UUID generated in your test environment
  "phone": "+1234567890",           // Example E.164 format number
  "otp": "123456"                   // Example 6-digit OTP
}
```

### With Supabase Auth

```
supabase functions serve --no-verify-jwt --env-file ./supabase/functions/.env.local
```

Modify `config.toml` to include the following

```
[auth.hook.send_sms]
enabled = true
uri = "http://host.docker.internal:54321/functions/v1/sms_sender"
secret= "env(SEND_SMS_HOOK_SECRET)"
```

### With a project on the Supabase platform

Ensure that you push all secrets to your remote setup:

```
supabase secrets set --env-file ./supabase/.env.local
```

Deploy your function by running:

`supabase functions deploy --no-verify-jwt` 



Copy the Send SMS Hook Secret from the Auth Hooks page. Alternatively, run `supabase hooks trigger -e send-sms --function-name sms_sender`

