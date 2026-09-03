// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { withSupabase } from 'npm:@supabase/server@^1'

console.log('Hello from Functions!')

interface Notification {
  id: string
  user_id: string
  body: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Notification
  schema: 'public'
  old_record: null | Notification
}

// Deploy with verify_jwt = false.
export default {
  fetch: withSupabase<any>({ auth: 'secret' }, async (req, ctx) => {
    const payload: WebhookPayload = await req.json()
    const { data } = await ctx.supabaseAdmin
      .from('profiles')
      .select('expo_push_token')
      .eq('id', payload.record.user_id)
      .single()

    if (!data?.expo_push_token) {
      return Response.json({ error: 'Expo push token not found' }, { status: 404 })
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
      },
      body: JSON.stringify({
        to: data.expo_push_token,
        sound: 'default',
        body: payload.record.body,
      }),
    }).then((res) => res.json())

    return Response.json(res)
  }),
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/push' \
//   --header 'apikey: <SUPABASE_SECRET_KEY>' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
