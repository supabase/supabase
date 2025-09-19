import { generateObject } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

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
    .min(2)
    .max(3)
    .describe('Array of related database tables for the application'),
  summary: z.string().optional().describe('Brief summary of the generated schema'),
})

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

  const { model, error: modelError } = await getModel({
    provider: 'openai',
    model: 'gpt-5-mini',
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

  if (typeof prompt !== 'string' || prompt.length > 500) {
    return res.status(400).json({ error: 'Prompt must be a string under 500 characters' })
  }

  try {
    const { object } = await generateObject({
      model,
      schema: ResponseSchema,
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
