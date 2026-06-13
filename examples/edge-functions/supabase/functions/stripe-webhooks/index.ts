// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Import via bare specifier thanks to the import_map.json file.
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { withSupabase } from 'npm:@supabase/server@^1'

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') as string, {
  // This is needed to use the Fetch API rather than relying on the Node http
  // package.
  apiVersion: '2024-11-20',
})
// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

console.log('Hello from Stripe Webhook!')

// Stripe verifies the request via its signature, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req) => {
    const signature = req.headers.get('Stripe-Signature')

    // First step is to verify the event. The .text() method must be used as the
    // verification relies on the raw request body rather than the parsed JSON.
    const body = await req.text()
    let receivedEvent
    try {
      receivedEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
        undefined,
        cryptoProvider
      )
    } catch (err) {
      return new Response(err.message, { status: 400 })
    }
    console.log(`🔔 Event received: ${receivedEvent.id}`)
    return Response.json({ ok: true })
  }),
}
