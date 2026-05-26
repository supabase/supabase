import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'
import OpenAI from 'jsr:@openai/openai@4'
import { z } from 'npm:zod@3'

const QUEUE_NAME = 'rag_embedding_jobs'
const EMBEDDING_MODEL = 'text-embedding-3-small'

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)

const jobSchema = z.object({
  jobId: z.number(),
  chunkId: z.string().uuid(),
})

type Job = z.infer<typeof jobSchema>

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  const parseResult = z.array(jobSchema).safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })
  }

  const completedJobs: Job[] = []
  const failedJobs: Array<Job & { error: string }> = []

  for (const job of parseResult.data) {
    try {
      await processJob(job)
      completedJobs.push(job)
    } catch (error) {
      failedJobs.push({
        ...job,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      })
    }
  }

  return Response.json({ completedJobs, failedJobs })
})

async function processJob({ jobId, chunkId }: Job) {
  const [chunk] = await sql<{ id: string; content: string }[]>`
    select id, content
    from public.rag_chunks
    where id = ${chunkId}
  `

  if (!chunk) {
    throw new Error(`chunk not found: ${chunkId}`)
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: chunk.content,
  })

  const embedding = response.data[0]?.embedding

  if (!embedding) {
    throw new Error('failed to generate embedding')
  }

  await sql`
    update public.rag_chunks
    set embedding = ${JSON.stringify(embedding)}
    where id = ${chunkId}
  `

  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`
}
