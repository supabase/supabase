import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 150

const requestSchema = z.object({
  source: z.string().min(1),
  content: z.string().min(1),
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

  const { source, content, metadata } = parseResult.data

  const { data: document, error: documentError } = await supabase
    .from('rag_documents')
    .insert({ source, metadata: metadata ?? {} })
    .select('id')
    .single()

  if (documentError || !document) {
    return Response.json(
      { error: `failed to create document: ${documentError?.message ?? 'unknown error'}` },
      { status: 500 }
    )
  }

  const chunks = chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP).map((text, index) => ({
    document_id: document.id,
    chunk_index: index,
    content: text,
  }))

  const { error: chunkError } = await supabase.from('rag_chunks').insert(chunks)

  if (chunkError) {
    return Response.json(
      { error: `failed to insert chunks: ${chunkError.message}` },
      { status: 500 }
    )
  }

  return Response.json({ documentId: document.id, chunkCount: chunks.length })
})

function chunkText(text: string, size: number, overlap: number): string[] {
  const trimmed = text.trim()
  if (trimmed.length <= size) return [trimmed]

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
