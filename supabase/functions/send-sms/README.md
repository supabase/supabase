# Supabase Send SMS Auth Hook

Use this edge function in an Auth Hook with the Send SMS Extension Point. In this example, we use the hook to send a message with an [AppHash](https://developers.google.com/identity/sms-retriever/verify#computing_your_apps_hash_string) via Twilio Programmable Messaging. The App Hash allows for autofill of OTP codes in an Android Application without having to exit the application to check SMS messages.

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

You will need the following addtional configuration variables:

```bash
APP_HASH="<YOUR_APP_HASH>"
SEND_SMS_HOOK_SECRET="whsec_<standard_base64_encoded_string>"
```

Generate the Hook secret with [Base64 encoding tool](https://www.base64encode.net/). It should follow the format `whsec_<base64_encoded_string_of_more_than_60_bytes>` Note that we use standard Base64 encoding which includes the `+`, `/`, and `=` characters - this is distinct from `Base64URLEncoding` which replaces `+` with `-` and `/` with `_`. Under base64 encoding, a string such as `supabasefunctionsareawesome` would correspond to a secret of `whsec_c3VwYWJhc2VmdW5jdGlvbnNhcmVhd2Vzb21l`

## Local Development

Writing the hook consists of two steps: Developing the Hook and connecting it to Supabase Auth.

### Develop the Hook

Use [this tool](https://www.standardwebhooks.com/simulate) to generate a sample cURL command to test the hook.

Set the destination URL to: `https://127.0.0.1:54321/functions/v1/<your_function_name>`

Use a raw payload with the following shape:

```
{
  "user": {
    "id": "daf04a9b-faac-4425-adb0-53872dee0b06",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "",
    "phone": "<your_phone_number>",
    "app_metadata": {
      "provider": "phone",
      "providers": ["phone"]
    },
    "user_metadata": {
      "email_verified": false,
      "phone_verified": false,
      "sub": "daf04a9b-faac-4425-adb0-53872dee0b06"
    },
    "identities": [
      {
        "identity_id": "7f984755-7ff2-44fa-aed5-2bb1967c6526",
        "id": "daf04a9b-faac-4425-adb0-53872dee0b06",
        "user_id": "daf04a9b-faac-4425-adb0-53872dee0b06",
        "identity_data": {
          "email_verified": false,
          "phone_verified": false,
          "sub": "daf04a9b-faac-4425-adb0-53872dee0b06"
        },
        "provider": "phone",
        "last_sign_in_at": "2024-04-23T15:10:17.084177129Z",
        "created_at": "2024-04-23T15:10:17.084235Z",
        "updated_at": "2024-04-23T15:10:17.084235Z"
      }
    ],
    "created_at": "2024-04-23T15:10:17.080112Z",
    "updated_at": "2024-04-23T15:10:17.088554Z",
    "is_anonymous": false
  },
  "sms": {
    "otp": "<your_otp>"
  }
}
```

Ensure that you periodically refresh the timestamp to ensure you don't run into verification errors

### Connect to Supabase Auth

Serve the function locally.

```
supabase functions serve --no-verify-jwt --env-file ./supabase/functions/.env.local
```

Modify the `config.toml` to ensure that Supabase Auth registers the Hook

```
[auth.hook.send_sms]
enabled = true
uri = "http://host.docker.internal:54321/functions/v1/sms_sender"
secret= "env(SEND_SMS_HOOK_SECRET)"
```

## Production

### Deploy the Function

Head to the `Auth > Hooks > Send SMS` page to copy the corresponding secret. Input the corresponding URL for the function and push all secrets to your remote setup and deploy the function

```
supabase secrets set --env-file ./supabase/.env.local
supabase functions deploy --no-verify-jwt
```
