import { createFileRoute } from '@tanstack/react-router'
import { generateText, Output } from 'ai'
import { source } from 'common-tags'
import { z } from 'zod'

import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

const codeSchema = z.object({
  sql: z
    .string()
    .nullable()
    .describe(
      'The converted SQL query from the provided client library code. Return null if the code is invalid'
    ),
  valid: z.boolean().describe('Whether the provided client library code is valid.'),
})

async function handlePost(request: Request): Promise<Response> {
  const { code } = await parseJsonBody<{ code?: string }>(request)

  if (!code) return Response.json({ error: 'Code is required' }, { status: 400 })

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
      output: Output.object({ schema: codeSchema }),
      prompt: source`
        Convert the follow Supabase client library code into SQL. The response should only be in JSON with the structure: { sql: string, valid: boolean }
        If the client library code does not look valid, return { sql: null, valid: false }. Otherwise return valid as true and sql as the converted SQL query

        ${code}
      `,
    })

    return Response.json(result.output)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Code parsing to SQL failed: ${error.message}`)

      // Check for context length error
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return Response.json(
          {
            error:
              'The provided code snippet is too large for Supabase Assistant to ingest. Try splitting it into smaller queries.',
          },
          { status: 400 }
        )
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return Response.json(
      { error: 'There was an unknown error parsing the client library code. Please try again.' },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/ai/sql/parse-client-code')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request }) => handlePost(request),
      },
      { withAuth: true }
    ),
  },
})
