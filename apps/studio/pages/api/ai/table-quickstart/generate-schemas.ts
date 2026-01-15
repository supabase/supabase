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
  const modelName = 'gpt-5-mini'
  const modelResult = await getModel({
    provider: 'openai',
    model: modelName,
    routingKey: 'table-quickstart',
    isLimited: false,
  })

  if (modelResult.error || !modelResult.model) {
    return res.status(500).json({
      error:
        modelResult.error?.message || 'AI service temporarily unavailable. Try again in a moment.',
    })
  }

  const { model, providerOptions } = modelResult

  const { prompt } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Please provide a description of your app' })
  }

  if (typeof prompt !== 'string' || prompt.length > LIMITS.MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      error: `Description too long. Keep it under ${LIMITS.MAX_PROMPT_LENGTH} characters.`,
    })
  }

  try {
    const abortController = new AbortController()
    req.on('close', () => abortController.abort())
    req.on('aborted', () => abortController.abort())

    const systemPrompt = `Generate exactly 3 core database tables.

      Schema rules:
      - Primary key: id (uuid) with isPrimary: true, defaultValue: 'gen_random_uuid()'
      - Timestamps: created_at, updated_at (timestamptz) with defaultValue: 'now()'
      - Use text for strings, timestamptz for dates, bigint for integers
      - snake_case naming

      Output rules (minimize tokens):
      - ALWAYS include: name, type, isNullable
      - Include isPrimary/isUnique/defaultValue ONLY when true/set
      - Omit summary field`

    const userPrompt = `Application: ${prompt}`

    const result = streamObject({
      model,
      abortSignal: abortController.signal,
      schema: ResponseSchema,
      mode: 'json',
      ...(providerOptions && { providerOptions }),
      system: systemPrompt,
      prompt: userPrompt,
    })

    result.pipeTextStreamToResponse(res)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error: 'Description too complex. Try using fewer words.',
        })
      }
    }

    return res.status(500).json({
      error: 'Unable to generate schema. Try a different description.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
