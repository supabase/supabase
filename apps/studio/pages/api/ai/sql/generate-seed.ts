import { generateText } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'

import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import apiWrapper from '@/lib/api/apiWrapper'

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

export async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { schema, users, prompt } = req.body as {
    schema: string
    users: Array<{ id: string; email: string }>
    prompt?: string
  }

  if (!schema) return res.status(400).json({ error: 'schema is required' })

  try {
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) return res.status(500).json({ error: modelError.message })

    const usersSection =
      users.length > 0
        ? `The following auth users exist in the project — use their exact UUIDs where the schema references user identity (e.g. profile IDs or owner/created_by columns):\n${users.map((u) => `  id: '${u.id}', email: '${u.email}'`).join('\n')}`
        : `No auth users are available. Use hardcoded UUID literals in the format 'a0000000-0000-0000-0000-00000000000N' for any user-identity columns, and add a comment noting they should be replaced with real user IDs.`

    const result = await generateText({
      ...modelParams,
      prompt: source`
        Generate SQL INSERT statements to seed a Postgres database for Row Level Security (RLS) testing.

        Schema:
        ${schema}

        ${usersSection}

        ${prompt ? `Additional context from the developer: ${prompt}` : ''}

        Rules:
        - Use hardcoded UUID literals (e.g. 'b0000000-0000-0000-0000-000000000001') for any IDs you need to cross-reference between inserts, so no PL/pgSQL DO block is needed
        - Insert parent tables before child tables to satisfy foreign key constraints
        - Use ON CONFLICT DO NOTHING on every INSERT (no conflict target column list — avoids PL/pgSQL variable ambiguity)
        - Generate realistic data: real-looking names, titles, emails, descriptions
        - Create multiple data scenarios that exercise different RLS policy branches (e.g. rows owned by different users, private vs public visibility)
        - Do NOT insert into auth.users — only insert into public schema tables

        Return ONLY the SQL, no markdown code fences, no explanations.
      `,
    })

    return res.json({ sql: result.text.trim() })
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI seed generation failed: ${error.message}`)
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error: 'Schema is too large for the AI to process. Try reducing the number of tables.',
        })
      }
    } else {
      console.error('AI seed generation failed with unknown error:', error)
    }
    return res.status(500).json({ error: 'Failed to generate seed data. Please try again.' })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
