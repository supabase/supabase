import { streamObject } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { LIMITS } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableQuickstart/constants'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'

export const maxDuration = 30

const MAX_RETRIES = 2

const ColumnSchema = z.object({
  name: z.string().describe('The column name in snake_case'),
  type: z.string().describe('PostgreSQL data type (e.g., bigint, text, timestamp with time zone)'),
  isPrimary: z.boolean().optional().nullable().describe('Whether this is a primary key'),
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
})

const ResponseSchema = z.object({
  tables: z.array(TableSchema).describe('Array of related database tables for the application'),
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
      res.status(405).json({
        data: null,
        error: { message: `Method ${method} Not Allowed` },
      })
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { model, providerOptions } = await getModel({
    provider: 'bedrock',
    model: 'openai.gpt-oss-120b-1:0',
    routingKey: 'table-quickstart',
    isLimited: false,
  })

  if (!model) {
    return res
      .status(500)
      .json({ error: 'The AI service is temporarily unavailable. Please try again in a moment.' })
  }

  const { prompt } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Please provide a description of your app.' })
  }

  if (typeof prompt !== 'string' || prompt.length > LIMITS.MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      error: `Your description is too long. Please keep it under ${LIMITS.MAX_PROMPT_LENGTH} characters.`,
    })
  }

  try {
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
      - Do NOT generate foreign key constraints or relationships
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

    await streamSchemaResponse(res, generateStream)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error:
            'Your description is too long. Try using fewer words to describe your application.',
        })
      }
    }

    return res.status(500).json({
      error: 'Unable to generate table schema. Please try again or use a different description.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

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

  let lastPartial: unknown = null

  const tryStream = async (): Promise<boolean> => {
    const result = generateStream()
    lastPartial = null
    let chunkCount = 0

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

      const hasTablesProp = (obj: unknown): obj is { tables: unknown[] } => {
        if (typeof obj !== 'object' || obj === null || !('tables' in obj)) {
          return false
        }
        return Array.isArray((obj as any).tables)
      }

      let finalObject: unknown = null
      try {
        finalObject = await result.object
      } catch {
        finalObject = null
      }

      if (hasTablesProp(finalObject) && finalObject.tables.length > LIMITS.MAX_TABLES) {
        finalObject.tables = finalObject.tables.slice(0, LIMITS.MAX_TABLES)
      }

      const parseResult = finalObject ? ResponseSchema.safeParse(finalObject) : null
      const objectToSend = parseResult?.success
        ? parseResult.data
        : hasTablesProp(finalObject)
          ? finalObject
          : hasTablesProp(lastPartial)
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
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const success = await tryStream()
      if (success) {
        return
      }

      if (attempt === MAX_RETRIES) {
        throw new Error(
          'The AI had trouble understanding your request. Try describing your app differently.'
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
