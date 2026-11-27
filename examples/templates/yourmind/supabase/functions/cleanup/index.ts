// Optional guest cleanup for public demos. When PURGE_GUEST_DAYS is set,
// deletes anonymous (guest) users older than that many days: first their
// images in Storage, then the users, which removes their items. Called by a
// Cron job with the project's secret key; does nothing when the variable is
// unset.

import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

export default {
  fetch: withSupabase({ auth: 'secret' }, async (_req, ctx) => {
    const days = Number(Deno.env.get('PURGE_GUEST_DAYS') ?? '0')
    if (!days) return Response.json({ skipped: 'PURGE_GUEST_DAYS is not set' })
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

    let purged = 0
    for (let page = 1; ; page++) {
      const { data, error } = await ctx.supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) return Response.json({ error: error.message }, { status: 500 })

      const guests = data.users.filter(
        (user) => user.is_anonymous && new Date(user.created_at).getTime() < cutoff
      )
      for (const guest of guests) {
        const { data: files } = await ctx.supabaseAdmin.storage
          .from('minds')
          .list(guest.id, { limit: 1000 })
        if (files?.length) {
          await ctx.supabaseAdmin.storage
            .from('minds')
            .remove(files.map((file) => `${guest.id}/${file.name}`))
        }
        const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(guest.id)
        if (!deleteError) purged += 1
      }
      if (data.users.length < 1000) break
    }

    return Response.json({ purged })
  }),
}
