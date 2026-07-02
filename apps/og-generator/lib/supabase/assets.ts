import { ICON_MAP } from '@/lib/assets/icon-library'
import { type SeedIcon } from '@/lib/assets/seed-icons'
import { getSupabase, getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * Asset library backed by the Supabase `assets` table (brief §3, §6).
 *
 * Reads use the anonymous (publishable) client and the public-read RLS policy;
 * writes use the admin (secret) client through our server route, so the
 * publishable key stays read-only. Everything degrades to seed-only when the
 * project isn't configured.
 *
 * Two asset kinds share this table (brief follow-up — custom color logos):
 *  - 'icon' (default): line art, inline SVG `body`, rendered stroke-only.
 *  - 'logo': full-color partner/acquisition logos. Stored as a file in the
 *    og-assets Storage bucket (`storage_path`), not inline — may be raster.
 *    `width`/`height` (client-measured at upload) drive aspect-correct
 *    rendering. Rendered as-is, no stroke normalization.
 */

const OG_ASSETS_BUCKET = 'og-assets'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

interface AssetRow {
  name: string
  label: string
  tags: string[] | null
  kind: string | null
  view_box: string
  body: string | null
  storage_path: string | null
  width: number | null
  height: number | null
}

/** Public URL for a Storage object, without an extra network round-trip. */
function publicStorageUrl(path: string): string | undefined {
  if (!SUPABASE_URL) return undefined
  return `${SUPABASE_URL}/storage/v1/object/public/${OG_ASSETS_BUCKET}/${path}`
}

function rowToIcon(r: AssetRow): SeedIcon {
  const kind = r.kind === 'logo' ? 'logo' : 'icon'
  return {
    name: r.name,
    label: r.label,
    tags: r.tags ?? [],
    viewBox: r.view_box,
    body: r.body ?? '',
    kind,
    url: r.storage_path ? publicStorageUrl(r.storage_path) : undefined,
    width: r.width ?? undefined,
    height: r.height ?? undefined,
  }
}

const COLUMNS = 'name,label,tags,kind,view_box,body,storage_path,width,height'

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
    return (data as AssetRow[]).filter((r) => r.body || r.storage_path).map(rowToIcon)
  } catch {
    return []
  }
}

/** Resolve an icon/logo by name: bundled seed first, then an uploaded asset. */
export async function resolveIcon(name: string): Promise<SeedIcon | null> {
  if (ICON_MAP[name]) return ICON_MAP[name]
  const supabase = getSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase.from('assets').select(COLUMNS).eq('name', name).maybeSingle()
    if (error || !data) return null
    const row = data as AssetRow
    if (!row.body && !row.storage_path) return null
    return rowToIcon(row)
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

/** Insert an uploaded line icon (admin/secret key). Throws 'NO_ADMIN' if unconfigured. */
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

export interface NewLogo {
  name: string
  label: string
  tags: string[]
  /** Raw file bytes — sanitized SVG text (as a Buffer) or the original raster bytes. */
  fileBody: Buffer
  contentType: string
  /** File extension without the dot, e.g. 'svg', 'png'. */
  ext: string
  /** Natural pixel size, measured client-side before upload. */
  width: number
  height: number
}

/**
 * Upload + insert a color logo (admin/secret key). Stores the file in the
 * og-assets Storage bucket rather than inline, so it works for raster too.
 * Throws 'NO_ADMIN' if unconfigured.
 */
export async function insertLogoAsset(a: NewLogo): Promise<SeedIcon> {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('NO_ADMIN')

  const path = `logos/${a.name}.${a.ext}`
  const { error: uploadError } = await admin.storage
    .from(OG_ASSETS_BUCKET)
    .upload(path, a.fileBody, { contentType: a.contentType, upsert: false })
  if (uploadError) throw new Error(uploadError.message)

  const { data, error } = await admin
    .from('assets')
    .insert({
      name: a.name,
      label: a.label,
      tags: a.tags,
      kind: 'logo',
      view_box: `0 0 ${a.width} ${a.height}`,
      storage_path: path,
      width: a.width,
      height: a.height,
    })
    .select(COLUMNS)
    .single()
  if (error || !data) throw new Error(error?.message ?? 'insert failed')
  return rowToIcon(data as AssetRow)
}
