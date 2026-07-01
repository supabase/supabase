import { sanitizeSvg } from '@/lib/assets/sanitize-svg'
import { insertAsset, listAssets } from '@/lib/supabase/assets'
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
      .slice(0, 40) || 'icon'
  )
}

/**
 * POST (multipart: `file` = SVG, optional `label`) → upload a line-art icon.
 * Sanitizes the SVG, then inserts it via the admin client. Writes need
 * SUPABASE_SECRET_KEY; without it we return a clear, actionable error.
 */
export async function POST(req: Request): Promise<Response> {
  if (!getSupabaseAdmin()) {
    return Response.json(
      {
        error:
          'Uploads need SUPABASE_SECRET_KEY in .env.local (and the 0001_init.sql migration applied).',
      },
      { status: 503 }
    )
  }

  let svgText = ''
  let label = ''
  try {
    const form = await req.formData()
    const file = form.get('file')
    label = typeof form.get('label') === 'string' ? (form.get('label') as string) : ''
    if (file instanceof File) {
      if (file.size > 100_000) {
        return Response.json({ error: 'SVG too large (max 100 KB).' }, { status: 400 })
      }
      svgText = await file.text()
      if (!label) label = file.name.replace(/\.svg$/i, '')
    }
  } catch {
    return Response.json({ error: 'Expected multipart form data with an SVG file.' }, { status: 400 })
  }

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
    console.error('[api/assets] insert failed:', err)
    return Response.json(
      { error: 'Could not save the asset — is the 0001_init.sql migration applied?' },
      { status: 500 }
    )
  }
}
