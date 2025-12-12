# NotificationAPI with Supabase Edge Functions

This example shows how to use NotificationAPI with [Supabase Edge Functions](https://supabase.com/docs/guides/functions).

## Prerequisites

To get the most out of this example, you'll need to:

1. [Create a NotificationAPI account and create your first notification](https://app.notificationapi.com) (part of our onboarding flow)
2. Get your Client ID and Client Secret from the [Environments screen](https://app.notificationapi.com/environments)
3. Set your environment variables in Supabase

```bash
supabase secrets set NOTIFICATIONAPI_CLIENT_ID=your_client_id
supabase secrets set NOTIFICATIONAPI_CLIENT_SECRET=your_client_secret
```

## Instructions

1. Make sure you have the latest version of the [Supabase CLI](https://supabase.com/docs/guides/cli#installation) installed.

2. Run function locally:

```sh
supabase start
supabase functions serve YOUR_FUNCTION_NAME --no-verify-jwt --env-file ./supabase/.env.local
```

GET http://localhost:54321/functions/v1/YOUR_FUNCTION_NAME

3. Deploy function to Supabase:

```sh
supabase functions deploy YOUR_FUNCTION_NAME --no-verify-jwt
```

## Usage

### Test with curl

Replace `YOUR_PROJECT_REF`, `YOUR_ANON_KEY`, and `YOUR_FUNCTION_NAME` with your actual values:

```bash
curl -L -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/YOUR_FUNCTION_NAME' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{
    "type": "your_notification_type",
    "email": "user@example.com",
    "number": "+1234567890",
    "parameters": {
      "comment": "Your custom parameters here"
    }
  }'
```

### Test with JavaScript/TypeScript

```typescript
const { data, error } = await supabase.functions.invoke('YOUR_FUNCTION_NAME', {
  body: {
    type: 'your_notification_type',
    email: 'user@example.com',
    parameters: {
      comment: 'Your custom parameters here',
    },
  },
})
```

## License

MIT License
