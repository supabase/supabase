import { generateObject } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'

const filterOptionSchema = z.union([
  z.string(),
  z
    .object({
      label: z.string().optional(),
      value: z.string().optional(),
    })
    .passthrough(),
])

const filterOperatorSchema = z.union([
  z.string(),
  z
    .object({
      label: z.string().optional(),
      value: z.string().optional(),
    })
    .passthrough(),
])

const filterPropertySchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum(['string', 'number', 'date', 'boolean']),
  operators: z.array(filterOperatorSchema).optional(),
  options: z.array(filterOptionSchema).optional(),
})

const filterConditionSchema = z.object({
  propertyName: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  operator: z.string(),
})

type FilterGroupType = {
  logicalOperator: 'AND' | 'OR'
  conditions: Array<z.infer<typeof filterConditionSchema> | FilterGroupType>
}

const filterGroupSchema: z.ZodType<FilterGroupType> = z.lazy(() =>
  z.object({
    logicalOperator: z.enum(['AND', 'OR']),
    conditions: z.array(z.union([filterConditionSchema, filterGroupSchema])),
  })
)

const requestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  filterProperties: z
    .array(filterPropertySchema)
    .min(1, 'At least one filter property is required'),
  currentPath: z.array(z.number()).optional(),
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
  const parseResult = requestSchema.safeParse(req.body)

  if (!parseResult.success) {
    const errorMessage = parseResult.error.errors.map((e) => e.message).join(', ')
    return res.status(400).json({ error: errorMessage })
  }

  const { prompt, filterProperties } = parseResult.data

  try {
    const { model, error: modelError } = await getModel({
      provider: 'openai',
      routingKey: 'sql',
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

    const result = await generateObject({
      model,
      schema: filterGroupSchema,
      prompt: source`
        You are an expert Postgres filter builder. Convert the user's request into structured filters.

        Available columns and allowed operators:
        ${JSON.stringify(propertiesForPrompt)}

        Rules:
        - Use only the provided property names and operators for each property.
        - Prefer logical operator "AND" unless the user explicitly asks for "OR".
        - When unsure, default to simple equality comparisons with reasonable values.
        - Values should respect property types: booleans must be true/false, dates should be ISO date strings (YYYY-MM-DD), and numbers must be numbers.
        - If options are provided for a property, choose from those values when appropriate.

        User request: "${prompt}"
      `,
    })

    const generatedFilters = result.object

    if (!validateFilterGroup(generatedFilters, normalizedFilterProperties)) {
      return res.status(400).json({
        error: 'Generated filters referenced invalid columns or operators.',
      })
    }

    return res.json(enforceAndLogicalOperator(generatedFilters))
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

function isFilterGroup(
  condition: FilterGroupType | z.infer<typeof filterConditionSchema>
): condition is FilterGroupType {
  return 'logicalOperator' in condition
}

function validateFilterGroup(
  group: FilterGroupType,
  properties: z.infer<typeof filterPropertySchema>[]
) {
  return group.conditions.every((condition) => {
    if (isFilterGroup(condition)) {
      return validateFilterGroup(condition, properties)
    }

    const property = properties.find((prop) => prop.name === condition.propertyName)
    if (!property) return false

    if (property.operators && property.operators.length > 0) {
      return property.operators.includes(condition.operator)
    }

    return true
  })
}

function enforceAndLogicalOperator(group: FilterGroupType): FilterGroupType {
  return {
    logicalOperator: 'AND',
    conditions: group.conditions.map((condition) =>
      isFilterGroup(condition) ? enforceAndLogicalOperator(condition) : condition
    ),
  }
}

function serializeOptions(options?: z.infer<typeof filterPropertySchema>['options']) {
  if (!options || !Array.isArray(options)) return undefined

  const serialized = options
    .map((option) => {
      if (typeof option === 'string') return option
      if (option?.label) return option.label
      if (option?.value) return option.value
      return null
    })
    .filter((value): value is string => Boolean(value))

  return serialized.length > 0 ? serialized : undefined
}

function serializeOperators(operators?: z.infer<typeof filterPropertySchema>['operators']) {
  if (!operators || !Array.isArray(operators) || operators.length === 0) return ['=']

  const serialized = operators
    .map((operator) => {
      if (typeof operator === 'string') return operator
      if (operator?.value) return operator.value
      if (operator?.label) return operator.label
      return null
    })
    .filter((value): value is string => Boolean(value))

  return serialized.length > 0 ? serialized : ['=']
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
