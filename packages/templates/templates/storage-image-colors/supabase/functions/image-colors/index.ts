import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { decode } from 'jsr:@imagescript/imagescript@1.3.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const SOURCE_BUCKET = 'images'
const PALETTE_SIZE = 5
const MAX_DIMENSION = 128

const requestSchema = z.object({
  objectId: z.string().uuid(),
  bucketId: z.string(),
  objectPath: z.string(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  const parseResult = requestSchema.safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })
  }

  const { objectId, bucketId, objectPath } = parseResult.data

  if (bucketId !== SOURCE_BUCKET) {
    return Response.json({ skipped: true, reason: `bucket ${bucketId} is not handled` })
  }

  try {
    const palette = await extractPalette(objectPath)

    await supabase
      .from('image_colors')
      .update({
        primary_color: palette[0]?.hex ?? null,
        secondary_color: palette[1]?.hex ?? null,
        palette,
        status: 'ready',
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('object_id', objectId)

    return Response.json({ objectId, palette })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    await supabase
      .from('image_colors')
      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })
      .eq('object_id', objectId)

    return Response.json({ objectId, error: message }, { status: 500 })
  }
})

type Rgb = [number, number, number]

type PaletteEntry = {
  hex: string
  rgb: Rgb
  population: number
  vibrancy: number
}

async function extractPalette(objectPath: string): Promise<PaletteEntry[]> {
  const { data: download, error } = await supabase.storage.from(SOURCE_BUCKET).download(objectPath)

  if (error || !download) {
    throw new Error(`failed to download image: ${error?.message ?? 'unknown error'}`)
  }

  const bytes = new Uint8Array(await download.arrayBuffer())
  const image = await decode(bytes)

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  if (scale < 1) {
    image.resize(
      Math.max(1, Math.round(image.width * scale)),
      Math.max(1, Math.round(image.height * scale))
    )
  }

  const pixels: Rgb[] = []
  const bitmap = image.bitmap
  for (let i = 0; i < bitmap.length; i += 4) {
    const alpha = bitmap[i + 3]
    if (alpha < 128) continue
    pixels.push([bitmap[i], bitmap[i + 1], bitmap[i + 2]])
  }

  if (pixels.length === 0) return []

  const buckets = medianCut(pixels, PALETTE_SIZE)
  return buckets
    .map(toPaletteEntry)
    .sort(
      (a, b) => b.vibrancy * Math.log(b.population + 1) - a.vibrancy * Math.log(a.population + 1)
    )
}

function medianCut(pixels: Rgb[], depth: number): Rgb[][] {
  if (pixels.length === 0) return []

  let buckets: Rgb[][] = [pixels]
  while (buckets.length < depth) {
    let widest = -1
    let widestIndex = -1
    let widestChannel = 0

    buckets.forEach((bucket, index) => {
      const ranges = channelRanges(bucket)
      const max = Math.max(...ranges)
      if (max > widest && bucket.length > 1) {
        widest = max
        widestIndex = index
        widestChannel = ranges.indexOf(max)
      }
    })

    if (widestIndex === -1) break

    const target = buckets[widestIndex]
    target.sort((a, b) => a[widestChannel] - b[widestChannel])
    const mid = target.length >> 1
    buckets = [
      ...buckets.slice(0, widestIndex),
      target.slice(0, mid),
      target.slice(mid),
      ...buckets.slice(widestIndex + 1),
    ]
  }

  return buckets
}

function channelRanges(bucket: Rgb[]): [number, number, number] {
  let rMin = 255,
    rMax = 0,
    gMin = 255,
    gMax = 0,
    bMin = 255,
    bMax = 0
  for (const [r, g, b] of bucket) {
    if (r < rMin) rMin = r
    if (r > rMax) rMax = r
    if (g < gMin) gMin = g
    if (g > gMax) gMax = g
    if (b < bMin) bMin = b
    if (b > bMax) bMax = b
  }
  return [rMax - rMin, gMax - gMin, bMax - bMin]
}

function toPaletteEntry(bucket: Rgb[]): PaletteEntry {
  let r = 0,
    g = 0,
    b = 0
  for (const [pr, pg, pb] of bucket) {
    r += pr
    g += pg
    b += pb
  }
  const count = bucket.length || 1
  const avg: Rgb = [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
  return {
    hex: toHex(avg),
    rgb: avg,
    population: bucket.length,
    vibrancy: vibrancy(avg),
  }
}

function vibrancy([r, g, b]: Rgb): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 510
  const saturation = max === 0 ? 0 : (max - min) / max
  return saturation * (1 - Math.abs(lightness - 0.55))
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}
