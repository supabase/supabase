import { SEED_ICON_MAP, type SeedIcon } from '@/lib/assets/seed-icons'
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * Asset library backed by the Supabase `assets` table (brief §3, §6).
 *
 * Reads use the anonymous (publishable) client and the public-read RLS policy;
 * writes use the admin (secret) client through our server route, so the
 * publishable key stays read-only. Everything degrades to seed-only when the
 * project isn't configured.
 */

interface AssetRow {
  name: string
  label: string
  tags: string[] | null
  view_box: string
  body: string | null
}

function rowToIcon(r: AssetRow): SeedIcon {
  return { name: r.name, label: r.label, tags: r.tags ?? [], viewBox: r.view_box, body: r.body ?? '' }
}

const COLUMNS = 'name,label,tags,view_box,body'

/** Uploaded assets, newest first. Returns [] when unconfigured or on error. */
export async function listAssets(): Promise<SeedIcon[]> {
  const supabase = getSupabase()
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('assets')
      .select(COLUMNS)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as AssetRow[]).filter((r) => r.body).map(rowToIcon)
  } catch {
    return []
  }
}

/** Resolve an icon by name: bundled seed first, then an uploaded asset. */
export async function resolveIcon(name: string): Promise<SeedIcon | null> {
  if (SEED_ICON_MAP[name]) return SEED_ICON_MAP[name]
  const supabase = getSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase.from('assets').select(COLUMNS).eq('name', name).maybeSingle()
    if (error || !data || !(data as AssetRow).body) return null
    return rowToIcon(data as AssetRow)
  } catch {
    return null
  }
}

export interface NewAsset {
  name: string
  label: string
  tags: string[]
  viewBox: string
  body: string
}

/** Insert an uploaded asset (admin/secret key). Throws 'NO_ADMIN' if unconfigured. */
export async function insertAsset(a: NewAsset): Promise<SeedIcon> {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('NO_ADMIN')
  const { data, error } = await admin
    .from('assets')
    .insert({ name: a.name, label: a.label, tags: a.tags, view_box: a.viewBox, body: a.body, kind: 'icon' })
    .select(COLUMNS)
    .single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')
  return rowToIcon(data as AssetRow)
}
