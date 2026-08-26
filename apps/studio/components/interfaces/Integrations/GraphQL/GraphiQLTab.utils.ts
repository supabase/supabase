const GRAPHQL_ENUM_VALUE_NAME_REGEX = /^[_A-Za-z][_0-9A-Za-z]*$/
const RESERVED_GRAPHQL_ENUM_VALUE_NAMES = new Set(['true', 'false', 'null'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isValidGraphQLEnumValueName = (name: unknown): name is string =>
  typeof name === 'string' &&
  GRAPHQL_ENUM_VALUE_NAME_REGEX.test(name) &&
  !RESERVED_GRAPHQL_ENUM_VALUE_NAMES.has(name)

const hasValidEnumValueName = (
  enumValue: unknown
): enumValue is Record<string, unknown> & { name: string } =>
  isRecord(enumValue) && isValidGraphQLEnumValueName(enumValue.name)

export const sanitizeIntrospectionResponse = <T>(response: T): T => {
  if (!isRecord(response) || !isRecord(response.data)) return response
  if (!isRecord(response.data.__schema) || !Array.isArray(response.data.__schema.types)) {
    return response
  }

  let hasChanges = false

  const types = response.data.__schema.types.map((type) => {
    if (!isRecord(type) || type.kind !== 'ENUM' || !Array.isArray(type.enumValues)) {
      return type
    }

    const enumValues = type.enumValues.filter(hasValidEnumValueName)
    if (enumValues.length === type.enumValues.length) return type

    hasChanges = true
    return { ...type, enumValues }
  })

  if (!hasChanges) return response

  return {
    ...response,
    data: {
      ...response.data,
      __schema: {
        ...response.data.__schema,
        types,
      },
    },
  } as T
}
