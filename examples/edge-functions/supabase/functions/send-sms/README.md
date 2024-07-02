# Supabase Send SMS Auth Hook

Use this Hook with the **Send SMS** Extension Point to send a message with an [AppHash](https://developers.google.com/identity/sms-retriever/verify#computing_your_apps_hash_string) via Twilio Programmable Messaging. The App Hash identifies a mobile application and is embedded it an SMS to allow an Android application to determine that the message was intended for the Application. In turn, this allows for the App to fetch specific information, such as OTP codes, to perform autofill so that the user does not have to exit the application to retrieve information from a message.



## Configuration

Copy this folder to the functions directory of your CLI project. In this case, my folder is located at `~/Desktop/auth_hooks/` so I will run:

```bash
cp -r ../send_sms/ ~/Desktop/auth_hooks/supabase/functions/send_sms/`
```

Copy the following environment variables from [the Twilio Console](https://console.twilio.com/) into your `.env.local` file:

```bash
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

Generate an `AppHash` via [these steps set out by Google](https://developers.google.com/identity/sms-retriever/verify#computing_your_apps_hash_string) and insert the AppHash into your `.env.local`

```bash
APP_HASH="<YOUR_APP_HASH>"
```

Next, head to the `Auth > Hooks > Send SMS > HTTP > Secret > Generate Secret` page to generate a secret. The Hook Secret should start with the version identifier, `v1,` followed by the signing prefix, `whsec_`, and finally the base64 secret. For instance, if your secret is `<secret>` then  you should include the following line

```bash
SEND_SMS_HOOK_SECRET=v1,whsec_<secret>
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
2. `sms` - contains metadata specific to SMS sending, including the One Time Pin which is typically six digits long.

For convenience, we have attached a mock payload below. Ensure that you fill in the corresponding `phone` and `otp` entries:

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

### Signature

This is an identifier generated using the timestamp, payload, and secret to ensure the authenticity of the sender. Periodically refresh the timestamp in the `Signature` section in order to ensure that you have a valid signature. 

Use the `SEND_SMS_HOOK_SECRET` from the `.env.local` file. This step is the same for both local and production functions.



## Connect to Supabase Auth

Connect the Edge Function as an Auth Hook after testing it. As the Hook runs on all cases where an SMS is sent, the user may not be signed in at point of Hook Invocation which in turn means that they might not have a JWT. We specify the `--no-verify-jwt` flag to adjust for this and allow for Auth to access the Hook. Security guarantees are instead provided through the checks discussed in the [Standard Webhook Specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)


**Local**

Modify your `config.toml` to ensure that Supabase Auth registers your Edge Function

```
[auth.hook.send_sms]
enabled = true
uri = "http://host.docker.internal:54321/functions/v1/sms_sender"
secret = "env(SEND_SMS_HOOK_SECRET)"
```


Start the function
```
supabase functions serve send-sms --no-verify-jwt --env-file ./supabase/functions/.env.local
```


**Production**

Register your secrets with the platform

```
supabase secrets set --env-file ./supabase/.env.local
```

Deploy your function if you have yet to do so

```
supabase functions deploy send-sms --no-verify-jwt
```

After connecting the Hook, test the Hook to see if it is functioning as expected.

You can do so via a curl request

```bash
curl -X POST http://localhost:9999/otp -H "Content-Type: application/json" -d '{"phone": "<your_phone_number>"}'
```

or via the client library

```
const { data, error } = await supabase.auth.signUp({
  phone: '123456789',
  password: 'example-password',
})
```

You should receive a message containing the App Hash if the Hooks is working as expected. 
