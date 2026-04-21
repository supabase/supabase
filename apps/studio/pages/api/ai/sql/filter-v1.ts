import { generateText, Output } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'

import { getModel } from '@/lib/ai/model'
import { DEFAULT_COMPLETION_MODEL } from '@/lib/ai/model.utils'
import apiWrapper from '@/lib/api/apiWrapper'
import {
  filterGroupSchemaForAI,
  requestSchema,
  serializeOperators,
  serializeOptions,
  validateFilterGroup,
} from '@/lib/api/filterHelpers'

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
  const parseResult = requestSchema.safeParse(req.body)

  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors.map((e) => e.message).join(', ')
    return res.status(400).json({ error: errorMessage })
  }

  const { prompt, filterProperties } = parseResult.data

  try {
    const { modelParams, error: modelError } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
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
      return res.status(400).json({
        error: 'Generated filters referenced invalid columns or operators.',
      })
    }

    return res.json(generatedFilters)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI filter generation failed: ${error.message}`)

      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return res.status(400).json({
          error:
            'Your filter prompt is too large for Supabase Assistant to ingest. Try splitting it into smaller prompts.',
        })
      }
    } else {
      console.error(`Unknown error: ${error}`)
    }

    return res.status(500).json({
      error: 'There was an unknown error generating filters. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
