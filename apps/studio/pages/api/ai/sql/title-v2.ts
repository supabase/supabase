import { generateObject } from 'ai'
import { source } from 'common-tags'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

const titleSchema = z.object({
  title: z
    .string()
    .describe(
      'The generated title for the SQL snippet (short and concise). Omit these words: "SQL", "Postgres", "Query", "Database"'
    ),
  description: z.string().describe('The generated description for the SQL snippet.'),
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
    body: { sql },
  } = req

  if (!sql) {
    return res.status(400).json({
      error: 'SQL query is required',
    })
  }

  try {
    const {
      model,
      error: modelError,
      providerOptions,
    } = await getModel({
      provider: 'openai',
      routingKey: 'sql',
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

    const result = await generateObject({
      model,
      providerOptions,
      schema: titleSchema,
      prompt: source`
        Generate a short title and summarized description for this Postgres SQL snippet:

        ${sql}

        The description should describe why this table was created (eg. "Table to track todos") or what the query does.
      `,
    })

    return res.json(result.object)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI title generation failed: ${error.message}`)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error:
            'Your SQL query is too large for Supabase Assistant to ingest. Try splitting it into smaller queries.',
        })
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the snippet title. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
