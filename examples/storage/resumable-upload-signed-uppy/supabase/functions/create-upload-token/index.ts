import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { withSupabase } from 'npm:@supabase/server@^1'

// Deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    try {
      const { filename } = await req.json()
      if (!filename) {
        return Response.json({ error: 'Missing filename' }, { status: 400 })
      }

      const { data, error } = await ctx.supabaseAdmin.storage
        .from('uploads')
        .createSignedUploadUrl(filename)

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }

      return Response.json({ token: data.token })
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 500 })
    }
  }),
}
