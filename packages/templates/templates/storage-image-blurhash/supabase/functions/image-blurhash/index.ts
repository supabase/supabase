import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { decode } from 'jsr:@imagescript/imagescript@1.3.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encode as encodeBlurhash } from 'npm:blurhash@2.0.5'
import { z } from 'npm:zod@3'

const SOURCE_BUCKET = 'images'
const COMPONENT_X = 4
const COMPONENT_Y = 3
const MAX_DIMENSION = 64

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
    const result = await computeBlurhash(objectPath)

    await supabase
      .from('image_blurhashes')
      .update({
        blurhash: result.blurhash,
        width: result.width,
        height: result.height,
        status: 'ready',
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('object_id', objectId)

    return Response.json({ objectId, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    await supabase
      .from('image_blurhashes')
      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })
      .eq('object_id', objectId)

    return Response.json({ objectId, error: message }, { status: 500 })
  }
})

async function computeBlurhash(objectPath: string) {
  const { data: download, error } = await supabase.storage.from(SOURCE_BUCKET).download(objectPath)

  if (error || !download) {
    throw new Error(`failed to download image: ${error?.message ?? 'unknown error'}`)
  }

  const bytes = new Uint8Array(await download.arrayBuffer())
  const image = await decode(bytes)
  const fullWidth = image.width
  const fullHeight = image.height

  const scale = Math.min(1, MAX_DIMENSION / Math.max(fullWidth, fullHeight))
  const targetWidth = Math.max(1, Math.round(fullWidth * scale))
  const targetHeight = Math.max(1, Math.round(fullHeight * scale))

  if (scale < 1) {
    image.resize(targetWidth, targetHeight)
  }

  const pixels = new Uint8ClampedArray(image.bitmap)
  const blurhash = encodeBlurhash(pixels, image.width, image.height, COMPONENT_X, COMPONENT_Y)

  return { blurhash, width: fullWidth, height: fullHeight }
}
