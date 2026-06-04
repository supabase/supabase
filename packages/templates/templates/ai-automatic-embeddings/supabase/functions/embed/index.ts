import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'
import OpenAI from 'jsr:@openai/openai@4'
import { z } from 'npm:zod@3'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)

const jobSchema = z.object({
  jobId: z.number(),
  id: z.union([z.number(), z.string()]),
  schema: z.string(),
  table: z.string(),
  contentFunction: z.string(),
  embeddingColumn: z.string(),
})

type Job = z.infer<typeof jobSchema>

const QUEUE_NAME = 'embedding_jobs'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  const parseResult = z.array(jobSchema).safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, {
      status: 400,
    })
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

async function processJob(job: Job) {
  const { jobId, id, schema, table, contentFunction, embeddingColumn } = job

  const [row] = await sql`
    select id, ${sql(contentFunction)}(t) as content
    from ${sql(schema)}.${sql(table)} t
    where id = ${id}
  `

  if (!row || typeof row.content !== 'string') {
    throw new Error(`row not found or invalid content: ${schema}.${table}/${id}`)
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: row.content,
  })

  const embedding = response.data[0]?.embedding

  if (!embedding) {
    throw new Error('failed to generate embedding')
  }

  await sql`
    update ${sql(schema)}.${sql(table)}
    set ${sql(embeddingColumn)} = ${JSON.stringify(embedding)}
    where id = ${id}
  `

  await sql`select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)`
}
