// Nightly cleanup, called by the `photo-wall-cleanup` Cron job with the
// project's secret key.
//
// 1. Deletes photos older than RETENTION_DAYS (default 7): files, then rows.
// 2. Optional, for public demos: when PURGE_GUEST_DAYS is set, deletes
//    anonymous (guest) users older than that many days, along with their
//    walls and every photo on them (files first, so none are left behind).

import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const BATCH_SIZE = 500
const DAY_MS = 24 * 60 * 60 * 1000

/** Deletes the files and rows of every photo matching `filter`, in batches. */
async function deletePhotos(
  admin: SupabaseClient,
  filter: (query: ReturnType<ReturnType<SupabaseClient['from']>['select']>) => typeof query
) {
  let deleted = 0
  while (true) {
    const { data: photos, error } = await filter(admin.from('photos').select('id, path')).limit(
      BATCH_SIZE
    )
    if (error) throw error
    if (photos.length === 0) return deleted

    const { error: storageError } = await admin.storage
      .from('photos')
      .remove(photos.map((photo) => photo.path))
    if (storageError) throw storageError
    const { error: deleteError } = await admin
      .from('photos')
      .delete()
      .in(
        'id',
        photos.map((photo) => photo.id)
      )
    if (deleteError) throw deleteError

    deleted += photos.length
    if (photos.length < BATCH_SIZE) return deleted
  }
}

/** Reads a day count from an env var: the fallback when unset, else a positive number. */
function days(name: string, fallback: number) {
  const value = Deno.env.get(name)
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${name} must be a positive number`)
  return parsed
}

async function purgeGuests(admin: SupabaseClient, guestDays: number) {
  const cutoff = Date.now() - guestDays * DAY_MS

  // Collect every eligible guest first, so deletions don't shift later pages.
  const guests: string[] = []
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const user of data.users) {
      if (user.is_anonymous && new Date(user.created_at).getTime() < cutoff) guests.push(user.id)
    }
    if (data.users.length < 1000) break
  }

  let purged = 0
  for (const guestId of guests) {
    // Remove every file on the guest's walls (other members' too, since the
    // walls go with the guest) and their own uploads elsewhere, before the
    // cascade deletes the rows that point at those files.
    const { data: walls, error: wallsError } = await admin
      .from('walls')
      .select('id')
      .eq('created_by', guestId)
    if (wallsError) throw wallsError
    const wallIds = walls.map((wall) => wall.id)
    if (wallIds.length > 0) await deletePhotos(admin, (query) => query.in('wall_id', wallIds))
    await deletePhotos(admin, (query) => query.eq('created_by', guestId))
    const { error: deleteError } = await admin.auth.admin.deleteUser(guestId)
    if (deleteError) throw deleteError
    purged += 1
  }
  return purged
}

export default {
  fetch: withSupabase({ auth: 'secret' }, async (_req, ctx) => {
    try {
      const retentionDays = days('RETENTION_DAYS', 7)
      const cutoff = new Date(Date.now() - retentionDays * DAY_MS).toISOString()
      const deleted = await deletePhotos(ctx.supabaseAdmin, (query) =>
        query.lt('created_at', cutoff)
      )

      const guestDays = days('PURGE_GUEST_DAYS', 0)
      const purgedGuests = guestDays > 0 ? await purgeGuests(ctx.supabaseAdmin, guestDays) : 0

      return Response.json({ deleted, purgedGuests })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return Response.json({ error: message }, { status: 500 })
    }
  }),
}
