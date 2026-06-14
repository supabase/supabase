import { withSupabase } from 'npm:@supabase/server@^1'

import { add } from './add-wasm/pkg/add_wasm.js'

// Public endpoint, so deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'none' }, async (req) => {
    const { a, b } = await req.json()
    return Response.json({ result: add(a, b) })
  }),
}
