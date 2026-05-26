import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 150
const SOURCE_BUCKET = 'rag-files'

const requestSchema = z.object({
  objectId: z.string().uuid(),
  bucketId: z.string(),
  objectPath: z.string(),
  mimeType: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
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

  const { objectId, bucketId, objectPath, mimeType, metadata } = parseResult.data

  if (bucketId !== SOURCE_BUCKET) {
    return Response.json({ skipped: true, reason: `bucket ${bucketId} is not handled` })
  }

  await markIngestion(objectId, { status: 'processing', error: null })

  try {
    assertSupportedFile(objectPath, mimeType ?? undefined)

    const text = await downloadText(objectPath)
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP)

    if (chunks.length === 0) {
      throw new Error('file did not contain ingestible text')
    }

    const { data: document, error: documentError } = await supabase
      .from('rag_documents')
      .insert({
        source: objectPath,
        metadata: {
          ...(metadata ?? {}),
          bucketId,
          objectId,
          objectPath,
          mimeType: mimeType ?? null,
        },
      })
      .select('id')
      .single()

    if (documentError || !document) {
      throw new Error(`failed to create RAG document: ${documentError?.message ?? 'unknown error'}`)
    }

    const { error: chunkError } = await supabase.from('rag_chunks').insert(
      chunks.map((content, index) => ({
        document_id: document.id,
        chunk_index: index,
        content,
      }))
    )

    if (chunkError) {
      throw new Error(`failed to insert RAG chunks: ${chunkError.message}`)
    }

    await markIngestion(objectId, {
      status: 'ready',
      document_id: document.id,
      error: null,
      metadata: { chunkCount: chunks.length },
    })

    return Response.json({ objectId, documentId: document.id, chunkCount: chunks.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    await markIngestion(objectId, { status: 'failed', error: message })

    return Response.json({ objectId, error: message }, { status: 500 })
  }
})

async function downloadText(objectPath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(SOURCE_BUCKET).download(objectPath)

  if (error || !data) {
    throw new Error(`failed to download file: ${error?.message ?? 'unknown error'}`)
  }

  return new TextDecoder().decode(await data.arrayBuffer()).trim()
}

function assertSupportedFile(objectPath: string, mimeType?: string) {
  const normalizedMime = mimeType?.toLowerCase()
  const normalizedPath = objectPath.toLowerCase()

  const isSupportedMime =
    normalizedMime === undefined ||
    normalizedMime.startsWith('text/plain') ||
    normalizedMime.startsWith('text/markdown') ||
    normalizedMime.startsWith('text/x-markdown')

  const isSupportedExtension =
    normalizedPath.endsWith('.txt') ||
    normalizedPath.endsWith('.md') ||
    normalizedPath.endsWith('.markdown')

  if (!isSupportedMime || !isSupportedExtension) {
    throw new Error('only .txt, .md, and .markdown files are supported')
  }
}

async function markIngestion(
  objectId: string,
  values: {
    status: 'processing' | 'ready' | 'failed'
    document_id?: string
    error?: string | null
    metadata?: Record<string, unknown>
  }
) {
  await supabase
    .from('rag_file_ingestions')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('object_id', objectId)
}

function chunkText(text: string, size: number, overlap: number): string[] {
  const trimmed = text.trim()
  if (trimmed.length <= size) return trimmed.length > 0 ? [trimmed] : []

  const chunks: string[] = []
  let start = 0

  while (start < trimmed.length) {
    const end = Math.min(start + size, trimmed.length)
    let breakAt = end

    if (end < trimmed.length) {
      const paragraphBreak = trimmed.lastIndexOf('\n\n', end)
      const sentenceBreak = trimmed.lastIndexOf('. ', end)
      const candidate = Math.max(paragraphBreak, sentenceBreak)
      if (candidate > start + size / 2) breakAt = candidate + 1
    }

    chunks.push(trimmed.slice(start, breakAt).trim())
    if (breakAt >= trimmed.length) break
    start = Math.max(breakAt - overlap, start + 1)
  }

  return chunks.filter((chunk) => chunk.length > 0)
}
