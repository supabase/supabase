export interface Parameter {
  name: string
  value: string
  defaultValue?: string
  type?: string
  possibleValues?: string[]
  occurrences: number
}

// [Joshen TODO] We'll want tests for this to ensure that this runs properly

export const parseParameters = (sql: string | undefined) => {
  if (!sql) return []

  // Parse @set parameter defaults with optional type information
  const setParamRegex = /@set\s+(\w+)(?::([^=]+))?\s*=\s*([^;\n]+)/g
  const paramDefaults: Record<string, { value: string; type?: string; possibleValues?: string[] }> =
    {}
  let match

  while ((match = setParamRegex.exec(sql)) !== null) {
    const [_, paramName, paramType, paramValue] = match
    if (!paramName || !paramValue?.trim()) continue

    const typeInfo = paramType?.trim()

    let type: string | undefined
    let possibleValues: string[] | undefined

    if (typeInfo) {
      // Handle union types (value1 | value2 | value3)
      if (typeInfo.includes('|')) {
        possibleValues = typeInfo.split('|').map((v) => v.trim())
        type = 'enum'
      } else {
        type = typeInfo.trim()
      }
    }

    paramDefaults[paramName] = {
      value: paramValue.trim(),
      type,
      possibleValues,
    }
  }

  // Find all :parameter occurrences and count them
  const paramRegex = /:(\w+)/g
  const paramOccurrences: Record<string, number> = {}
  const uniqueParams = new Set<string>()

  while ((match = paramRegex.exec(sql)) !== null) {
    const [_, paramName] = match
    paramOccurrences[paramName] = (paramOccurrences[paramName] || 0) + 1
    uniqueParams.add(paramName)
  }

  // Create parameter objects for unique parameters
  return Array.from(uniqueParams).map((paramName) => ({
    name: paramName,
    value: paramDefaults[paramName]?.value || '',
    defaultValue: paramDefaults[paramName]?.value,
    type: paramDefaults[paramName]?.type,
    possibleValues: paramDefaults[paramName]?.possibleValues,
    occurrences: paramOccurrences[paramName],
  }))
}

export const processParameterizedSql = (sql: string, parameters: Record<string, string>) => {
  // Parse @set parameter defaults with type information from SQL
  const setParamRegex = /@set\s+(\w+)(?::([^=]+))?\s*=\s*([^;\n]+)/g
  const paramDefaults: Record<string, { value: string; type?: string; possibleValues?: string[] }> =
    {}
  let match

  while ((match = setParamRegex.exec(sql)) !== null) {
    const [_, paramName, paramType, paramValue] = match
    if (!paramName || !paramValue?.trim()) continue

    const typeInfo = paramType?.trim()
    let type: string | undefined
    let possibleValues: string[] | undefined

    if (typeInfo) {
      if (typeInfo.includes('|')) {
        possibleValues = typeInfo.split('|').map((v) => v.trim())
        type = 'enum'
      } else {
        type = typeInfo.trim()
      }
    }

    paramDefaults[paramName] = {
      value: paramValue.trim(),
      type,
      possibleValues,
    }
  }

  // Remove @set lines from SQL
  let processedSql = sql.replace(/@set\s+\w+(?:\s*:\s*[^=]+)?\s*=\s*[^;\n]+[\n;]*/g, '')

  // Replace :parameters with values
  const paramRegex = /:(\w+)/g
  processedSql = processedSql.replace(paramRegex, (match, paramName) => {
    const value = parameters[paramName] ?? paramDefaults[paramName]?.value
    if (value === undefined) {
      throw new Error(`Missing value for parameter: ${paramName}`)
    }
    return value
  })

  return processedSql
}
