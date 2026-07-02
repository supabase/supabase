import { sanitizeLogoSvg, sanitizeSvg } from '@/lib/assets/sanitize-svg'
import { insertAsset, insertLogoAsset, listAssets } from '@/lib/supabase/assets'
import { getSupabaseAdmin } from '@/lib/supabase/server'

// Node runtime — uses the Supabase server clients + parses uploaded files.
export const runtime = 'nodejs'

/** GET → the uploaded asset library (public read; [] when unconfigured). */
export async function GET(): Promise<Response> {
  return Response.json({ assets: await listAssets() })
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

const RASTER_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
const MAX_LOGO_BYTES = 2_000_000 // 2 MB

/**
 * POST — two upload kinds, selected by the `kind` form field ('icon', default,
 * or 'logo'):
 *
 *  - kind=icon (multipart: `file` = SVG, optional `label`): a line-art icon.
 *    Sanitized to stroke-only and inserted inline (unchanged behavior).
 *  - kind=logo (multipart: `file` = SVG/PNG/JPEG/WebP, `label`, `width`,
 *    `height`): a full-color partner/acquisition logo (brief follow-up).
 *    Colors are preserved; the file is stored in the og-assets bucket rather
 *    than inline, and `width`/`height` (client-measured) drive aspect-correct
 *    rendering later.
 *
 * Both need SUPABASE_SECRET_KEY — without it we return a clear 503 so the
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
  return kind === 'logo' ? handleLogoUpload(form) : handleIconUpload(form)
}

async function handleIconUpload(form: FormData): Promise<Response> {
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
    const asset = await insertAsset({ name, label: displayLabel, tags, viewBox: clean.viewBox, body: clean.body })
    return Response.json({ asset })
  } catch (err) {
    console.error('[api/assets] icon insert failed:', err)
    return Response.json({ error: 'Could not save the icon — is 0001_init.sql applied?' }, { status: 500 })
  }
}

async function handleLogoUpload(form: FormData): Promise<Response> {
  const file = form.get('file')
  let label = typeof form.get('label') === 'string' ? (form.get('label') as string) : ''
  const width = Number(form.get('width'))
  const height = Number(form.get('height'))

  if (!(file instanceof File)) {
    return Response.json({ error: 'Expected an SVG, PNG, JPEG, or WebP file.' }, { status: 400 })
  }
  if (file.size > MAX_LOGO_BYTES) {
    return Response.json({ error: 'Logo too large (max 2 MB).' }, { status: 400 })
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return Response.json({ error: 'Missing or invalid logo dimensions.' }, { status: 400 })
  }
  if (!label) label = file.name.replace(/\.\w+$/, '')

  const displayLabel = (label || 'Logo').trim().slice(0, 40) || 'Logo'
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
        { error: 'Not a usable SVG logo (empty, too complex, or contained unsupported content).' },
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
      return Response.json({ error: 'Unsupported file type — use SVG, PNG, JPEG, or WebP.' }, { status: 400 })
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
    })
    return Response.json({ asset })
  } catch (err) {
    console.error('[api/assets] logo insert failed:', err)
    return Response.json(
      { error: 'Could not save the logo — is 0002_logo_assets.sql applied?' },
      { status: 500 }
    )
  }
}
