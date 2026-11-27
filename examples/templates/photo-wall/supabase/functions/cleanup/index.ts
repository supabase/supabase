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

async function purgeGuests(admin: SupabaseClient, days: number) {
  const cutoff = Date.now() - days * DAY_MS
  let purged = 0
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    for (const guest of data.users) {
      if (!guest.is_anonymous || new Date(guest.created_at).getTime() >= cutoff) continue
      const { data: walls } = await admin.from('walls').select('id').eq('created_by', guest.id)
      const wallIds = (walls ?? []).map((wall) => wall.id)
      if (wallIds.length > 0) await deletePhotos(admin, (query) => query.in('wall_id', wallIds))
      await deletePhotos(admin, (query) => query.eq('created_by', guest.id))
      const { error: deleteError } = await admin.auth.admin.deleteUser(guest.id)
      if (!deleteError) purged += 1
    }
    if (data.users.length < 1000) return purged
  }
}

export default {
  fetch: withSupabase({ auth: 'secret' }, async (_req, ctx) => {
    try {
      const retentionDays = Number(Deno.env.get('RETENTION_DAYS') ?? '7')
      const cutoff = new Date(Date.now() - retentionDays * DAY_MS).toISOString()
      const deleted = await deletePhotos(ctx.supabaseAdmin, (query) =>
        query.lt('created_at', cutoff)
      )

      const guestDays = Number(Deno.env.get('PURGE_GUEST_DAYS') ?? '0')
      const purgedGuests = guestDays ? await purgeGuests(ctx.supabaseAdmin, guestDays) : 0

      return Response.json({ deleted, purgedGuests })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return Response.json({ error: message }, { status: 500 })
    }
  }),
}
