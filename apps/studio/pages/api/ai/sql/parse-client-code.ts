import { generateText, Output } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import apiWrapper from '@/lib/api/apiWrapper'

const codeSchema = z.object({
  sql: z
    .string()
    .optional()
    .describe(
      'The converted SQL query from the provided client library code. Return undefined if the code is invalid'
    ),
  valid: z.boolean().describe('Whether the provided client library code is valid.'),
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

export async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    body: { code },
  } = req

  if (!code) return res.status(400).json({ error: 'Code is required' })

  try {
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const result = await generateText({
      ...modelParams,
      output: Output.object({ schema: codeSchema }),
      prompt: source`
        Convert the follow Supabase client library code into SQL. The response should only be in JSON with the structure: { sql: string, valid: boolean }
        If the client library code does not look valid, return { sql: undefined, valid: false }. Otherwise return valid as true and sql as the converted SQL query

        ${code}
      `,
    })

    return res.json(result.output)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Code parsing to SQL failed: ${error.message}`)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error:
            'The provided code snippet is too large for Supabase Assistant to ingest. Try splitting it into smaller queries.',
        })
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error parsing the client library code. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
