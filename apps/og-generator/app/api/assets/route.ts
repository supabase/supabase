import { sanitizeLogoSvg, sanitizeSvg } from '@/lib/assets/sanitize-svg'
import { DEFAULT_BRAND_ID } from '@/lib/design/brands'
import {
  deleteAsset,
  insertAsset,
  insertLogoAsset,
  listAssets,
  renameAsset,
  type NewFileAsset,
} from '@/lib/supabase/assets'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Node runtime — uses the Supabase server clients + parses uploaded files.
export const runtime = 'nodejs'

/** GET → the uploaded asset library for a brand (public read; [] when unconfigured). */
export async function GET(req: Request): Promise<Response> {
  const brand = new URL(req.url).searchParams.get('brand') || DEFAULT_BRAND_ID
  return Response.json({ assets: await listAssets(brand) })
}

/** PATCH → rename an uploaded asset's label. Body: { name, brand, label }. */
export async function PATCH(req: Request): Promise<Response> {
  if (!getSupabaseAdmin()) {
    return Response.json({ error: NO_ADMIN_ERROR }, { status: 503 })
  }
  let body: { name?: string; brand?: string; label?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Expected JSON body.' }, { status: 400 })
  }
  const name = typeof body.name === 'string' ? body.name : ''
  const brand = typeof body.brand === 'string' ? body.brand : DEFAULT_BRAND_ID
  const label = (typeof body.label === 'string' ? body.label : '').trim().slice(0, 40)
  if (!name || !label) {
    return Response.json({ error: 'Missing asset name or new label.' }, { status: 400 })
  }
  try {
    const asset = await renameAsset(name, brand, label)
    return Response.json({ asset })
  } catch (err) {
    console.error('[api/assets] rename failed:', err)
    return Response.json({ error: `Could not rename the asset (${errorMessage(err)})` }, { status: 500 })
  }
}

/** DELETE → remove an uploaded asset. Query params: ?name=&brand= */
export async function DELETE(req: Request): Promise<Response> {
  if (!getSupabaseAdmin()) {
    return Response.json({ error: NO_ADMIN_ERROR }, { status: 503 })
  }
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name') || ''
  const brand = searchParams.get('brand') || DEFAULT_BRAND_ID
  if (!name) {
    return Response.json({ error: 'Missing asset name.' }, { status: 400 })
  }
  try {
    await deleteAsset(name, brand)
    return Response.json({ ok: true })
  } catch (err) {
    console.error('[api/assets] delete failed:', err)
    return Response.json({ error: `Could not delete the asset (${errorMessage(err)})` }, { status: 500 })
  }
}

/** Surfaces the underlying DB error text so a stale-schema guess never masks the real cause. */
function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'asset'
  )
}

const NO_ADMIN_ERROR =
  'Uploads need SUPABASE_SECRET_KEY in .env.local (and the migrations applied).'

// Restricted to png — svg is handled separately (sanitized + either inlined
// as line art or stored, depending on kind). jpeg/webp were previously
// accepted for logos but are dropped: uploads are meant to be a clean
// color/white mark against the dark canvas, not an arbitrary photo.
const RASTER_TYPES: Record<string, string> = {
  'image/png': 'png',
}
const MAX_FILE_BYTES = 2_000_000 // 2 MB

/**
 * POST — selected by the `kind` form field ('icon', default, or 'logo'),
 * each accepting an SVG or PNG file (multipart: `file`, optional `label`):
 *
 *  - kind=icon + SVG: a line-art icon. Sanitized to stroke-only and
 *    inserted inline, rendered with the brand's illustration stroke color
 *    at request time (unchanged behavior).
 *  - kind=icon + PNG, or kind=logo (SVG or PNG): stored as a file in the
 *    og-assets Storage bucket rather than inline, rendered as-is (colors
 *    preserved, no stroke normalization) — a PNG can't be dynamically
 *    recolored the way an inline SVG icon can, so icon PNGs are expected to
 *    already be a white/monochrome mark that reads on the dark canvas, same
 *    as a color logo upload. `width`/`height` (client-measured) drive
 *    aspect-correct rendering.
 *
 * Needs SUPABASE_SECRET_KEY — without it we return a clear 503 so the
 * button never just silently fails.
 */
export async function POST(req: Request): Promise<Response> {
  if (!getSupabaseAdmin()) {
    return Response.json({ error: NO_ADMIN_ERROR }, { status: 503 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return Response.json({ error: 'Expected multipart form data.' }, { status: 400 })
  }

  const kind = form.get('kind') === 'logo' ? 'logo' : 'icon'
  const brand = typeof form.get('brand') === 'string' ? (form.get('brand') as string) : DEFAULT_BRAND_ID
  const file = form.get('file')
  const isSvg =
    file instanceof File && (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg'))

  return kind === 'icon' && isSvg ? handleIconSvgUpload(form, brand) : handleFileUpload(form, brand, kind)
}

async function handleIconSvgUpload(form: FormData, brand: string): Promise<Response> {
  const file = form.get('file')
  let label = typeof form.get('label') === 'string' ? (form.get('label') as string) : ''

  if (!(file instanceof File)) {
    return Response.json({ error: 'Expected an SVG file.' }, { status: 400 })
  }
  if (file.size > 100_000) {
    return Response.json({ error: 'SVG too large (max 100 KB).' }, { status: 400 })
  }
  const svgText = await file.text()
  if (!label) label = file.name.replace(/\.svg$/i, '')

  const clean = sanitizeSvg(svgText)
  if (!clean) {
    return Response.json(
      { error: 'Not a usable line-art SVG (empty, too complex, or contained unsupported content).' },
      { status: 400 }
    )
  }

  const displayLabel = (label || 'Icon').trim().slice(0, 40) || 'Icon'
  const name = `${slugify(displayLabel)}-${Date.now().toString(36).slice(-4)}`
  const tags = Array.from(new Set(slugify(displayLabel).split('-').filter((w) => w.length > 1)))

  try {
    const asset = await insertAsset({
      name,
      label: displayLabel,
      tags,
      viewBox: clean.viewBox,
      body: clean.body,
      brand,
    })
    return Response.json({ asset })
  } catch (err) {
    console.error('[api/assets] icon insert failed:', err)
    return Response.json(
      {
        error: `Could not save the icon — is every supabase/migrations/*.sql file applied? (${errorMessage(err)})`,
      },
      { status: 500 }
    )
  }
}

/** Shared by kind=logo (SVG or PNG) and kind=icon+PNG — both are stored as a file, not inlined. */
async function handleFileUpload(form: FormData, brand: string, kind: 'icon' | 'logo'): Promise<Response> {
  const file = form.get('file')
  let label = typeof form.get('label') === 'string' ? (form.get('label') as string) : ''
  const width = Number(form.get('width'))
  const height = Number(form.get('height'))
  const noun = kind === 'icon' ? 'icon' : 'logo'

  if (!(file instanceof File)) {
    return Response.json({ error: 'Expected an SVG or PNG file.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: `${kind === 'icon' ? 'Icon' : 'Logo'} too large (max 2 MB).` }, { status: 400 })
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return Response.json({ error: `Missing or invalid ${noun} dimensions.` }, { status: 400 })
  }
  if (!label) label = file.name.replace(/\.\w+$/, '')

  const displayLabel = (label || (kind === 'icon' ? 'Icon' : 'Logo')).trim().slice(0, 40) || 'Logo'
  const name = `${slugify(displayLabel)}-${Date.now().toString(36).slice(-4)}`
  const tags = Array.from(new Set(slugify(displayLabel).split('-').filter((w) => w.length > 1)))

  let fileBody: Buffer
  let contentType: string
  let ext: string

  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  if (isSvg) {
    const clean = sanitizeLogoSvg(await file.text())
    if (!clean) {
      return Response.json(
        { error: `Not a usable SVG ${noun} (empty, too complex, or contained unsupported content).` },
        { status: 400 }
      )
    }
    fileBody = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${clean.viewBox}">${clean.body}</svg>`
    )
    contentType = 'image/svg+xml'
    ext = 'svg'
  } else {
    ext = RASTER_TYPES[file.type]
    if (!ext) {
      return Response.json({ error: 'Unsupported file type — use SVG or PNG.' }, { status: 400 })
    }
    fileBody = Buffer.from(await file.arrayBuffer())
    contentType = file.type
  }

  try {
    const asset = await insertLogoAsset({
      name,
      label: displayLabel,
      tags,
      fileBody,
      contentType,
      ext,
      width: Math.round(width),
      height: Math.round(height),
      brand,
      kind,
    } satisfies NewFileAsset)
    return Response.json({ asset })
  } catch (err) {
    console.error(`[api/assets] ${noun} insert failed:`, err)
    return Response.json(
      {
        error: `Could not save the ${noun} — is every supabase/migrations/*.sql file applied? (${errorMessage(err)})`,
      },
      { status: 500 }
    )
  }
}
