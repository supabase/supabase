// Finishes saving an item: reads a link's preview (title, description, image,
// site name), then embeds the item's text for semantic search. Called by the
// app right after it inserts the item, with the user's session; every query
// runs through RLS as that user.

import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

import { embed } from '../_shared/embed.ts'
import { fetchPublic } from '../_shared/public-fetch.ts'

const FETCH_TIMEOUT_MS = 8000
const MAX_HTML_BYTES = 512 * 1024

interface Preview {
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/**
 * A numeric entity's character, or '' for code points Postgres text can't
 * hold (NUL, lone surrogates) or that don't exist (fromCodePoint would throw).
 */
function fromCodePoint(code: number) {
  const valid = Number.isInteger(code) && code >= 1 && code <= 0x10ffff
  return valid && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : ''
}

/** Decodes common HTML entities in a single pass, so nothing is decoded twice. */
function decodeEntities(text: string) {
  return text.replace(/&(#\d+|#x[\da-f]+|amp|lt|gt|quot|apos);/gi, (entity, name: string) => {
    const lower = name.toLowerCase()
    if (lower.startsWith('#x')) return fromCodePoint(parseInt(lower.slice(2), 16))
    if (lower.startsWith('#')) return fromCodePoint(Number(lower.slice(1)))
    return ENTITIES[lower] ?? entity
  })
}

/** Plain text from an HTML fragment. Saved as text and rendered as text, never as HTML. */
function toPlainText(html: string) {
  let text = html
  // Repeat until stable, so nested or broken tags can't leave a tag behind.
  for (let previous = ''; previous !== text; ) {
    previous = text
    text = text.replace(/<[^<>]*>/g, '')
  }
  // Postgres text can't hold NUL characters, so drop any the page contains.
  return decodeEntities(text).replace(/[<>\u0000]/g, '')
}

function metaContent(html: string, key: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]
    if (name?.toLowerCase() !== key) continue
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1]
    if (content) return toPlainText(content.trim())
  }
  return null
}

// Pages without a description (Wikipedia, for one) still have a first
// paragraph worth embedding.
function firstParagraph(html: string) {
  for (const match of html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = toPlainText(match[1])
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length >= 80) return text.slice(0, 500)
  }
  return null
}

/** Resolves a preview image URL, keeping only http(s) images. */
function httpUrl(value: string, base: string) {
  try {
    const url = new URL(value, base)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

async function readPreview(url: string): Promise<Preview> {
  // Only public hosts, checked on every redirect, so a saved link can't make
  // this function read internal addresses.
  const response = await fetchPublic(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; YourMind/1.0)', accept: 'text/html' },
  })
  const empty = { title: null, description: null, imageUrl: null, siteName: null }
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
    await response.body?.cancel()
    return empty
  }

  // Read only the start of the page; the <head> is all we need.
  const reader = response.body!.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    size += value.length
  }
  await reader.cancel()
  const html = new TextDecoder().decode(
    chunks.reduce((all, chunk) => {
      const merged = new Uint8Array(all.length + chunk.length)
      merged.set(all)
      merged.set(chunk, all.length)
      return merged
    }, new Uint8Array())
  )

  const image = metaContent(html, 'og:image') ?? metaContent(html, 'twitter:image')
  return {
    title:
      metaContent(html, 'og:title') ??
      toPlainText(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '') ??
      null,
    description:
      metaContent(html, 'og:description') ??
      metaContent(html, 'description') ??
      firstParagraph(html),
    imageUrl: image ? httpUrl(image, response.url) : null,
    siteName: metaContent(html, 'og:site_name'),
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { id } = await req.json()
    const { data: item, error } = await ctx.supabase
      .from('items')
      .select('id, kind, title, body, url, created_by')
      .eq('id', id)
      .single()
    if (error) return Response.json({ error: error.message }, { status: 404 })

    let { title, body } = item
    const update: Record<string, unknown> = {}

    if (item.kind === 'link' && item.url) {
      try {
        const preview = await readPreview(item.url)
        title = title || preview.title?.slice(0, 300) || null
        body = body || preview.description?.slice(0, 5000) || null
        Object.assign(update, {
          title,
          body,
          image_url: preview.imageUrl?.slice(0, 2000) ?? null,
          site_name: preview.siteName?.slice(0, 200) ?? new URL(item.url).hostname.replace(/^www\./, ''),
        })
      } catch {
        // Unreachable or slow page: keep the link, just without a preview.
        update.site_name = new URL(item.url).hostname.replace(/^www\./, '')
      }
    }

    const text = [title, body, update.site_name, item.url].filter(Boolean).join('\n')
    const embedding = await embed(text || item.kind)

    const { error: embeddingError } = await ctx.supabase
      .from('item_embeddings')
      .upsert({ item_id: item.id, created_by: item.created_by, embedding: JSON.stringify(embedding) })
    const { data: saved, error: updateError } = await ctx.supabase
      .from('items')
      .update({ ...update, status: embeddingError ? 'failed' : 'ready' })
      .eq('id', item.id)
      .select(
        'id, kind, title, body, url, site_name, image_url, image_path, status, created_by, created_at'
      )
      .single()

    const failure = embeddingError ?? updateError
    if (failure) return Response.json({ error: failure.message }, { status: 500 })
    // Returned so the app can show the result without waiting for Realtime.
    return Response.json({ item: saved })
  }),
}
