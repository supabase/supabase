import { streamObject } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { LIMITS } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableQuickstart/constants'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'

// See https://vercel.com/docs/functions/configuring-functions/duration
export const maxDuration = 30

const ColumnSchema = z.object({
  name: z.string().describe('The column name in snake_case'),
  type: z.string().describe('PostgreSQL data type (e.g., bigint, text, timestamp with time zone)'),
  isPrimary: z.boolean().optional().nullable().describe('Whether this is a primary key'),
  isForeign: z.boolean().optional().nullable().describe('Whether this is a foreign key'),
  references: z.string().optional().nullable().describe('Table.column this foreign key references'),
  isNullable: z.boolean().optional().nullable().describe('Whether the column can be null'),
  defaultValue: z.string().optional().nullable().describe('Default value or expression'),
  isUnique: z
    .boolean()
    .optional()
    .nullable()
    .describe('Whether the column has a unique constraint'),
})

const TableSchema = z.object({
  name: z.string().describe('The table name in snake_case'),
  description: z.string().describe('A brief description of what this table stores'),
  columns: z.array(ColumnSchema).describe('Array of columns in the table'),
  relationships: z
    .array(
      z.object({
        from: z.string().describe('Source column in this table'),
        to: z.string().describe('Target table.column'),
        type: z.enum(['one-to-one', 'one-to-many', 'many-to-many', 'many-to-one']),
      })
    )
    .optional()
    .nullable()
    .describe('Relationships to other tables'),
})

const ResponseSchema = z.object({
  tables: z
    .array(TableSchema)
    .min(LIMITS.MIN_TABLES_TO_GENERATE)
    .max(LIMITS.MAX_TABLES_TO_GENERATE)
    .describe('Array of related database tables for the application'),
  summary: z.string().optional().describe('Brief summary of the generated schema'),
})

type SchemaStreamResult = ReturnType<typeof streamObject<typeof ResponseSchema>>

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  // Generate unique request ID for tracing
  const requestId = `table-gen-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

  const {
    model,
    error: modelError,
    providerOptions,
  } = await getModel({
    provider: 'bedrock',
    model: 'openai.gpt-oss-120b-1:0',
    routingKey: 'table-quickstart',
    isLimited: false,
  })

  if (modelError || !model) {
    console.error(`[${requestId}] Model initialization failed:`, modelError)
    return res.status(500).json({ error: 'AI service temporarily unavailable' })
  }

  const { prompt } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  if (typeof prompt !== 'string' || prompt.length > LIMITS.MAX_PROMPT_LENGTH) {
    return res
      .status(400)
      .json({ error: `Prompt must be a string under ${LIMITS.MAX_PROMPT_LENGTH} characters` })
  }

  try {
    const wantsStream = shouldStream(req)

    const abortController = new AbortController()
    req.on('close', () => abortController.abort())
    req.on('aborted', () => abortController.abort())

    const result = streamObject({
      model,
      abortSignal: abortController.signal,
      schema: ResponseSchema,
      mode: 'json',
      ...(providerOptions && { providerOptions }),
      system: `You are a Supabase PostgreSQL schema designer. Generate exactly 2-3 core tables based on the user's description.

      Rules:
      - Use "id uuid" as primary key with type: 'uuid'
      - ALWAYS mark the "id" field with isPrimary: true
      - Set defaultValue: 'gen_random_uuid()' for UUID primary keys
      - Use 'text' for string data, 'timestamptz' for timestamps
      - Use snake_case naming consistently
      - Add created_at, updated_at timestamps with type: 'timestamptz' and defaultValue: 'now()'
      - Reference auth.users(id) for user relations when appropriate
      - Keep descriptions brief (one sentence)
      - Focus on the most essential tables only

      Be concise and practical.`,
      prompt: `Generate a database schema for: ${prompt}

      Create a practical, production-ready schema with related tables that would be needed for this application.`,
    })

    if (wantsStream) {
      await streamSchemaResponse(res, result)
      return
    }

    const object = await result.object

    return res.status(200).json(object)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error: 'The prompt is too long. Please provide a shorter description.',
        })
      }
    }

    return res.status(500).json({
      error: 'Failed to generate database schemas. Please try again.',
    })
  }
}

function shouldStream(req: NextApiRequest) {
  if (req.headers['accept']?.includes('text/event-stream')) return true
  if (req.headers['x-ai-stream'] === 'true') return true
  const { stream } = req.query
  if (typeof stream === 'string') {
    return stream === 'true'
  }
  return false
}

async function streamSchemaResponse(res: NextApiResponse, result: SchemaStreamResult) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  const writeEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    for await (const partial of result.partialObjectStream) {
      if (!partial) continue
      writeEvent('partial', partial)
    }

    const finalObject = await result.object
    writeEvent('complete', finalObject)
  } catch (error) {
    console.error('Error while streaming schema:', error)
    writeEvent('error', {
      message: error instanceof Error ? error.message : 'Failed to stream schema',
    })
  } finally {
    res.end()
  }
}
