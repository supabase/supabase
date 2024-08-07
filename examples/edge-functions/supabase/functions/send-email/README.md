# Supabase Send Email Auth Hook

Use this Hook with the **Send Email** Extension Point to send emails with Internationalization support. In this example, we make the arbitrary choice of using Postmark as an email provider - in practice any email sender will work.

## Configuration

Copy this folder to your CLI project. In this case, my folder is located at `~/Desktop/auth_hooks/` so I will run:

```bash
cp -r ../send-email/ ~/Desktop/auth_hooks/supabase/functions/send-email/`
```

Copy the following environment variables from [Postmark](https://postmarkapp.com/) into your `.env.local` file:

```bash
POSTMARK_SERVER_TOKEN=""
```

Next, head to the `Auth > Hooks > Send Email > HTTP > Secret > Generate Secret` page to generate a secret. The Hook Secret should start with the version identifier, `v1,` followed by the signing prefix, `whsec_`, and finally the base64 secret. For instance, if your secret is `<secret>` then  you should include the following line


```bash
SEND_EMAIL_HOOK_SECRET="whsec_<standard_base64_encoded_string>"
```

in your `.env.local file`.

## Testing The Hook

Supabase follows the Standard Webhooks Specification, which is a set of guidelines used to align how webhooks are implemented. The specification describes how to secure a payload to guard against malicious attackers. Constructing a specification compliant payload can be tricky, so we use [the Simulate tool](https://www.standardwebhooks.com/simulate) provided by the specification Standard Webhooks Specification to test our Hook. In practice, you can use any HTTP function as a hook. However, for convenience and also in the spirit of dogfooding, we will describe the use of the tool with a Supabase Edge Function.


### The Standard Webhooks Verification Tool

You can use the tool with an Edge Function run locally, via the CLI, or an Edge Function deployed on the platform. We will term deployed Edge Functions as "Production" functions. 

For both Local and Production Edge Functions you will need to fill the following fields:

### Destination URL

This is the endpoint where your Hook is running.

**Local**: `https://127.0.0.1:54321/functions/v1/<your_function_name>`

**Production**: `https://<project-ref>.functions.supabase.co/<function-name>`


### Raw Payload

Payload that Auth sends to the Hook. For the Send SMS Hook, the payload contains these entries:

1. `user` - contains information describing a user, including their phone number, which we wish to send a message to.
2. `email_data` - contains metadata specific to email sending. The `token` entry typically contains a six digit numeric pin.

For convenience, we have attached a mock payload below. Ensure that you fill in the corresponding `email` and `token` entries:



```
{
  "user": {
    "id": "c5135635-e6d7-428b-baee-0b0c4c710af2",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "<your-email>",
    "phone": "",
    "app_metadata": {
      "provider": "email",
      "providers": [
        "email"
      ]
    },
    "user_metadata": {
      "email": "<your-email>",
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
          "email": "<your-email>",
          "email_verified": false,
          "phone_verified": false,
          "sub": "c5135635-e6d7-428b-baee-0b0c4c710af2"
        },
        "provider": "email",
        "last_sign_in_at": "2024-04-24T12:07:25.029407681Z",
        "created_at": "2024-04-24T12:07:25.029445Z",
        "updated_at": "2024-04-24T12:07:25.029445Z",
        "email": "<your-email>"
      }
    ],
    "created_at": "2024-04-24T12:07:25.022509Z",
    "updated_at": "2024-04-24T12:07:25.032548Z",
    "is_anonymous": false
  },
  "email_data": {
    "token": "<otp>",
    "token_hash": "",
    "redirect_to": "http://localhost:3000/",
    "email_action_type": "signup",
    "site_url": "http://localhost:9999",
    "token_new": "",
    "token_hash_new": ""
  }
}
```


### Signature

This is an identifier generated using the timestamp, payload, and secret to ensure the authenticity of the sender. Periodically refresh the timestamp in the `Signature` section in order to ensure that you have a valid signature. 

Use the `SEND_EMAIL_HOOK_SECRET` from the `.env.local` file. This step is the same for both local and production functions.



## Connect to Supabase Auth

Connect the Edge Function as an Auth Hook after testing it. As the Hook runs on all cases where an SMS is sent, the user may not be signed in at point of Hook Invocation which in turn means that they might not have a JWT. We specify the `--no-verify-jwt` flag to adjust for this and allow for Auth to access the Hook. Security guarantees are instead provided through the checks discussed in the [Standard Webhook Specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)


**Local**

Modify your `config.toml` to ensure that Supabase Auth registers your Edge Function

```
[auth.hook.send_sms]
enabled = true
uri = "http://host.docker.internal:54321/functions/v1/sms_sender"
secret = "env(SEND_EMAIL_HOOK_SECRET)"
```


Start the function
```
supabase functions serve send-email --no-verify-jwt --env-file ./supabase/functions/.env.local
```


**Production**

Register your secrets with the platform

```
supabase secrets set --env-file ./supabase/.env.local
```

Deploy your function if you have yet to do so

```
supabase functions deploy send-email --no-verify-jwt
```

After connecting the Hook, test the Hook to see if it is functioning as expected.

You can do so via a curl request

```bash
curl -X POST http://localhost:9999/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "<your_email>", "password": "<your-password>", "options": {"data": {"i18n": "es"}}}'
```

or via the client library

```

const { data, error } = await supabase.auth.signUp(
  {
    email: 'example@email.com',
    password: 'example-password',
    options: {
      data: {
        i18n: 'es',
      }
    }
  }
)

```

You should recieve an email as in Spanish if it is working as expected
