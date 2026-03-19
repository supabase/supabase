import { z } from 'zod'

export const filterOptionSchema = z.union([
  z.string(),
  z
    .object({
      label: z.string().optional(),
      value: z.string().optional(),
    })
    .passthrough(),
])

export const filterOperatorSchema = z.union([
  z.string(),
  z
    .object({
      label: z.string().optional(),
      value: z.string().optional(),
    })
    .passthrough(),
])

export const filterPropertySchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum(['string', 'number', 'date', 'boolean']),
  operators: z.array(filterOperatorSchema).optional(),
  options: z.array(filterOptionSchema).optional(),
})

export const filterConditionSchema = z.object({
  propertyName: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  operator: z.string(),
})

export type FilterGroupType = {
  logicalOperator: 'AND' | 'OR'
  conditions: Array<z.infer<typeof filterConditionSchema> | FilterGroupType>
}

export const filterGroupSchema: z.ZodType<FilterGroupType> = z.lazy(() =>
  z.object({
    logicalOperator: z.enum(['AND', 'OR']),
    conditions: z.array(z.union([filterConditionSchema, filterGroupSchema])),
  })
)

export const requestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  filterProperties: z
    .array(filterPropertySchema)
    .min(1, 'At least one filter property is required'),
  currentPath: z.array(z.number()).optional(),
})

export function isFilterGroup(
  condition: FilterGroupType | z.infer<typeof filterConditionSchema>
): condition is FilterGroupType {
  return 'logicalOperator' in condition
}

export function validateFilterGroup(
  group: FilterGroupType,
  properties: z.infer<typeof filterPropertySchema>[]
): boolean {
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

export function enforceAndLogicalOperator(group: FilterGroupType): FilterGroupType {
  return {
    logicalOperator: 'AND',
    conditions: group.conditions.map((condition) =>
      isFilterGroup(condition) ? enforceAndLogicalOperator(condition) : condition
    ),
  }
}

export function serializeOptions(
  options?: z.infer<typeof filterPropertySchema>['options']
): string[] | undefined {
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

export function serializeOperators(
  operators?: z.infer<typeof filterPropertySchema>['operators']
): string[] {
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
