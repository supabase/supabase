import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createCanvas } from 'npm:@napi-rs/canvas@0.1.55'
import * as pdfjs from 'npm:pdfjs-dist@4.7.76/legacy/build/pdf.mjs'
import { z } from 'npm:zod@3'

const SOURCE_BUCKET = 'pdfs'
const TARGET_BUCKET = 'pdf-thumbnails'
const RENDER_SCALE = 1.5

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
    const thumbnailPath = await renderThumbnail(objectId, objectPath)

    await supabase
      .from('pdf_thumbnails')
      .update({
        thumbnail_path: thumbnailPath,
        status: 'ready',
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('object_id', objectId)

    return Response.json({ objectId, thumbnailPath })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    await supabase
      .from('pdf_thumbnails')
      .update({ status: 'failed', error: message, updated_at: new Date().toISOString() })
      .eq('object_id', objectId)

    return Response.json({ objectId, error: message }, { status: 500 })
  }
})

async function renderThumbnail(objectId: string, objectPath: string): Promise<string> {
  const { data: download, error: downloadError } = await supabase.storage
    .from(SOURCE_BUCKET)
    .download(objectPath)

  if (downloadError || !download) {
    throw new Error(`failed to download PDF: ${downloadError?.message ?? 'unknown error'}`)
  }

  const pdfData = new Uint8Array(await download.arrayBuffer())
  const document = await pdfjs.getDocument({ data: pdfData, disableFontFace: true }).promise
  const page = await document.getPage(1)
  const viewport = page.getViewport({ scale: RENDER_SCALE })

  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
  const context = canvas.getContext('2d')

  await page.render({
    // @ts-expect-error — @napi-rs/canvas context is compatible at runtime
    canvasContext: context,
    viewport,
  }).promise

  const png = await canvas.encode('png')
  const thumbnailPath = `${objectId}.png`

  const { error: uploadError } = await supabase.storage
    .from(TARGET_BUCKET)
    .upload(thumbnailPath, png, { contentType: 'image/png', upsert: true })

  if (uploadError) {
    throw new Error(`failed to upload thumbnail: ${uploadError.message}`)
  }

  return thumbnailPath
}
