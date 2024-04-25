# Supabase Send Email Auth Hook

Use this edge function in an Auth Hook with the Send Email Extension Point. In this example, we use the hook to make use of Postmark as an email provider.

## Configuration

Copy this folder to your CLI project. In this case, my folder is located at `~/Desktop/auth_hooks/` so I will run:

```bash
cp -r ../send_sms/ ~/Desktop/auth_hooks/supabase/functions/send_sms/`
```

Copy the following environment variables from [the Twilio Console](https://console.twilio.com/) into your `.env.local` file:

```bash
POSTMARK_SERVER_TOKEN=""
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
    "id": "c5135635-e6d7-428b-baee-0b0c4c710af2",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "youremail@email.com",
    "phone": "",
    "app_metadata": {
      "provider": "email",
      "providers": [
        "email"
      ]
    },
    "user_metadata": {
      "email": "youremail@email.com",
      "email_verified": false,
      "phone_verified": false,
      "sub": "c5135635-e6d7-428b-baee-0b0c4c710af2"
    },
    "identities": [
      {
        "identity_id": "b3dbeb8a-ed30-46bc-83a1-f5ed975ec120",
        "id": "c5135635-e6d7-428b-baee-0b0c4c710af2",
        "user_id": "c5135635-e6d7-428b-baee-0b0c4c710af2",
        "identity_data": {
          "email": "youremail@email.com",
          "email_verified": false,
          "phone_verified": false,
          "sub": "c5135635-e6d7-428b-baee-0b0c4c710af2"
        },
        "provider": "email",
        "last_sign_in_at": "2024-04-24T12:07:25.029407681Z",
        "created_at": "2024-04-24T12:07:25.029445Z",
        "updated_at": "2024-04-24T12:07:25.029445Z",
        "email": "youremail@email.com"
      }
    ],
    "created_at": "2024-04-24T12:07:25.022509Z",
    "updated_at": "2024-04-24T12:07:25.032548Z",
    "is_anonymous": false
  },
  "email_data": {
    "token": "123456",
    "token_hash": "",
    "redirect_to": "http://localhost:3000/",
    "email_action_type": "signup",
    "site_url": "http://localhost:9999",
    "token_new": "",
    "token_hash_new": ""
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
