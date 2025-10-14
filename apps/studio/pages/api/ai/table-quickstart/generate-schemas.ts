import { streamObject } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { LIMITS } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableQuickstart/constants'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'

export const maxDuration = 30

const ColumnSchema = z.object({
  name: z.string().describe('The column name in snake_case'),
  type: z.string().describe('PostgreSQL data type (e.g., bigint, text, timestamp with time zone)'),
  isPrimary: z.boolean().optional().nullable().describe('Whether this is a primary key'),
  isForeign: z.boolean().optional().nullable().describe('Whether this is a foreign key'),
  references: z
    .object({
      table: z.string(),
      column: z.string(),
    })
    .passthrough()
    .optional()
    .nullable()
    .describe('Foreign key reference details'),
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
    .union([z.record(z.any()), z.array(z.any())])
    .optional()
    .nullable()
    .describe('Foreign key relationships'),
})

const ResponseSchema = z.object({
  tables: z.array(TableSchema).describe('Array of related database tables for the application'),
  summary: z.string().optional().describe('Brief summary of the generated schema'),
})

type SchemaStreamResult = ReturnType<typeof streamObject<typeof ResponseSchema>>

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
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

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
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
    return res.status(500).json({ error: 'The AI service is temporarily unavailable. Please try again in a moment.' })
  }

  const { prompt } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Please provide a description of your application.' })
  }

  if (typeof prompt !== 'string' || prompt.length > LIMITS.MAX_PROMPT_LENGTH) {
    return res
      .status(400)
      .json({ error: `Your description is too long. Please keep it under ${LIMITS.MAX_PROMPT_LENGTH} characters.` })
  }

  try {
    const wantsStream = shouldStream(req)

    const abortController = new AbortController()
    req.on('close', () => abortController.abort())
    req.on('aborted', () => abortController.abort())

    const systemPrompt = `You are a Supabase PostgreSQL schema designer. Generate exactly 2-3 core tables based on the user's description.

      Rules:
      - Use "id uuid" as primary key with type: 'uuid'
      - ALWAYS mark the "id" field with isPrimary: true
      - Set defaultValue: 'gen_random_uuid()' for UUID primary keys
      - Use 'text' for string data, 'timestamptz' for timestamps
      - Use snake_case naming consistently
      - Add created_at, updated_at timestamps with type: 'timestamptz' and defaultValue: 'now()'
      - Reference auth.users(id) for user relations when appropriate
      - For foreign key columns, use references as an object: { "table": "table_name", "column": "column_name" }
      - Keep descriptions brief (one sentence)
      - Focus on the most essential tables only

      Be concise and practical.`

    const userPrompt = `Generate a database schema for: ${prompt}

      Create a practical, production-ready schema with related tables that would be needed for this application.`

    const generateStream = () =>
      streamObject({
        model,
        abortSignal: abortController.signal,
        schema: ResponseSchema,
        mode: 'json',
        ...(providerOptions && { providerOptions }),
        system: systemPrompt,
        prompt: userPrompt,
      })

    if (wantsStream) {
      await streamSchemaResponse(res, generateStream)
      return
    }

    const result = generateStream()
    const object = await result.object

    return res.status(200).json(object)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error: 'Your description is too long. Try using fewer words to describe your application.',
        })
      }
    }

    return res.status(500).json({
      error: 'Unable to generate table schema. Please try again or use a different description.',
    })
  }
}

const shouldStream = (req: NextApiRequest) => {
  if (req.headers['accept']?.includes('text/event-stream')) return true
  if (req.headers['x-ai-stream'] === 'true') return true
  return false
}

const streamSchemaResponse = async (
  res: NextApiResponse,
  generateStream: () => SchemaStreamResult
) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })

  const writeEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  const MAX_RETRIES = 1
  let attempt = 0
  let lastPartial: any = null
  let chunkCount = 0

  const tryStream = async (): Promise<boolean> => {
    const result = generateStream()
    lastPartial = null
    chunkCount = 0

    try {
      for await (const partial of result.partialObjectStream) {
        if (!partial) continue
        chunkCount++
        lastPartial = partial
        writeEvent('partial', partial)
      }

      if (chunkCount === 0) {
        return false
      }

      const hasTables = (obj: any) =>
        obj?.tables && Array.isArray(obj.tables) && obj.tables.length > 0

      let finalObject: any = null
      try {
        finalObject = await result.object
      } catch {
        finalObject = null
      }

      if (finalObject && hasTables(finalObject) && finalObject.tables.length > LIMITS.MAX_TABLES) {
        finalObject.tables = finalObject.tables.slice(0, LIMITS.MAX_TABLES)
      }

      const parseResult = finalObject ? ResponseSchema.safeParse(finalObject) : null
      const objectToSend = parseResult?.success
        ? parseResult.data
        : hasTables(finalObject)
          ? finalObject
          : hasTables(lastPartial)
            ? lastPartial
            : null

      if (objectToSend) {
        writeEvent('complete', objectToSend)
        return true
      }

      return false
    } catch {
      return false
    }
  }

  try {
    for (attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const success = await tryStream()
      if (success) {
        return
      }

      if (attempt === MAX_RETRIES) {
        throw new Error(
          'The AI had trouble understanding your request. Try describing your application differently.'
        )
      }
    }
  } catch (error) {
    writeEvent('error', {
      message:
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again or refresh the page.',
    })
  } finally {
    res.end()
  }
}
