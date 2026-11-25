import { createFileRoute } from '@tanstack/react-router'
import { generateText, Output } from 'ai'
import { source } from 'common-tags'

import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import {
  filterGroupSchemaForAI,
  requestSchema,
  serializeOperators,
  serializeOptions,
  validateFilterGroup,
} from '@/lib/api/filterHelpers'

async function handlePost(request: Request): Promise<Response> {
  const body = await parseJsonBody(request)
  const parseResult = requestSchema.safeParse(body)

  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors.map((e) => e.message).join(', ')
    return Response.json({ error: errorMessage }, { status: 400 })
  }

  const { prompt, filterProperties } = parseResult.data

  try {
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) {
      return Response.json({ error: modelError.message }, { status: 500 })
    }

    const normalizedFilterProperties = filterProperties.map((property) => ({
      ...property,
      operators: serializeOperators(property.operators),
      options: serializeOptions(property.options),
    }))

    const propertiesForPrompt = normalizedFilterProperties.map((property) => ({
      name: property.name,
      label: property.label,
      type: property.type,
      operators: property.operators,
      options: property.options,
    }))

    const result = await generateText({
      ...modelParams,
      output: Output.object({ schema: filterGroupSchemaForAI }),
      prompt: source`
        You are an expert Postgres filter builder. Convert the user's request into structured filters.

        Available columns and allowed operators:
        ${JSON.stringify(propertiesForPrompt)}

        Rules:
        - Use only the provided property names and operators for each property.
        - When unsure, default to simple equality comparisons with reasonable values.
        - Values should respect property types: booleans must be true/false, dates should be ISO date strings (YYYY-MM-DD), and numbers must be numbers.
        - If options are provided for a property, choose from those values when appropriate.
        - The "is" operator is used for NULL checks. Valid values are: null, not null. For boolean columns, true and false are also valid.

        User request: "${prompt}"
      `,
    })

    const generatedFilters = result.output

    if (!validateFilterGroup(generatedFilters, normalizedFilterProperties)) {
      return Response.json(
        { error: 'Generated filters referenced invalid columns or operators.' },
        { status: 400 }
      )
    }

    return Response.json(generatedFilters)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI filter generation failed: ${error.message}`)

      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return Response.json(
          {
            error:
              'Your filter prompt is too large for Supabase Assistant to ingest. Try splitting it into smaller prompts.',
          },
          { status: 400 }
        )
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return Response.json(
      { error: 'There was an unknown error generating filters. Please try again.' },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/ai/sql/filter-v1')({
  server: {
    handlers: createApiHandlers(
      {
        POST: ({ request }) => handlePost(request),
      },
      { withAuth: true }
    ),
  },
})
