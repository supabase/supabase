// Optional guest cleanup for public demos. When PURGE_GUEST_DAYS is a positive
// number, deletes anonymous (guest) users older than that many days: first
// their images in Storage, then the users, which removes their items. Called
// by a Cron job with the project's secret key; does nothing when the variable
// is unset or zero.

import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

/** Reads PURGE_GUEST_DAYS: 0 when unset, a positive number, or an error. */
function purgeDays() {
  const value = Deno.env.get('PURGE_GUEST_DAYS')
  if (!value) return 0
  const days = Number(value)
  if (!Number.isFinite(days) || days < 0) {
    throw new Error('PURGE_GUEST_DAYS must be a positive number of days')
  }
  return days
}

/**
 * Collects every eligible guest before deleting anyone, so deletions don't
 * shift later pages and skip users.
 */
async function findGuests(admin: SupabaseClient, cutoff: number) {
  const guests: string[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE })
    if (error) throw error
    for (const user of data.users) {
      if (user.is_anonymous && new Date(user.created_at).getTime() < cutoff) guests.push(user.id)
    }
    if (data.users.length < PAGE_SIZE) return guests
  }
}

export default {
  fetch: withSupabase({ auth: 'secret' }, async (_req, ctx) => {
    try {
      const days = purgeDays()
      if (days === 0) return Response.json({ skipped: 'PURGE_GUEST_DAYS is not set' })

      const guests = await findGuests(ctx.supabaseAdmin, Date.now() - days * 24 * 60 * 60 * 1000)
      const failures: string[] = []
      for (const guestId of guests) {
        const { data: files, error: listError } = await ctx.supabaseAdmin.storage
          .from('minds')
          .list(guestId, { limit: 1000 })
        if (listError) {
          failures.push(`${guestId}: ${listError.message}`)
          continue
        }
        if (files.length > 0) {
          const { error: removeError } = await ctx.supabaseAdmin.storage
            .from('minds')
            .remove(files.map((file) => `${guestId}/${file.name}`))
          if (removeError) {
            failures.push(`${guestId}: ${removeError.message}`)
            continue
          }
        }
        const { error: deleteError } = await ctx.supabaseAdmin.auth.admin.deleteUser(guestId)
        if (deleteError) failures.push(`${guestId}: ${deleteError.message}`)
      }

      return Response.json(
        { purged: guests.length - failures.length, failures },
        { status: failures.length > 0 ? 500 : 200 }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return Response.json({ error: message }, { status: 500 })
    }
  }),
}
