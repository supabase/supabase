import { withSupabase } from 'npm:@supabase/server@^1'

import { add } from './add-wasm/pkg/add_wasm.js'

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    const { a, b } = await req.json()
    return Response.json({ result: add(a, b) })
  }),
}
