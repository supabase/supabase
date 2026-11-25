import { createFileRoute } from '@tanstack/react-router'
import { generateText, Output } from 'ai'
import { source } from 'common-tags'
import { z } from 'zod'

import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

const titleSchema = z.object({
  title: z
    .string()
    .describe(
      'The generated title for the SQL snippet (short and concise). Omit these words: "SQL", "Postgres", "Query", "Database"'
    ),
  description: z.string().describe('The generated description for the SQL snippet.'),
})

async function handlePost(request: Request): Promise<Response> {
  const { sql } = await parseJsonBody<{ sql?: string }>(request)

  if (!sql) {
    return Response.json({ error: 'SQL query is required' }, { status: 400 })
  }

  try {
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) {
      return Response.json({ error: modelError.message }, { status: 500 })
    }

    const result = await generateText({
      ...modelParams,
      output: Output.object({ schema: titleSchema }),
      prompt: source`
        Generate a short title and summarized description for this Postgres SQL snippet:

        ${sql}

        The description should describe why this table was created (eg. "Table to track todos") or what the query does.
      `,
    })

    return Response.json(result.output)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI title generation failed: ${error.message}`)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return Response.json(
          {
            error:
              'Your SQL query is too large for Supabase Assistant to ingest. Try splitting it into smaller queries.',
          },
          { status: 400 }
        )
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return Response.json(
      { error: 'There was an unknown error generating the snippet title. Please try again.' },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/ai/sql/title-v2')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request }) => handlePost(request),
      },
      { withAuth: true }
    ),
  },
})
