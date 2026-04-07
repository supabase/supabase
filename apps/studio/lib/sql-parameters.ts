export interface Parameter {
  name: string
  value: string
  defaultValue?: string
  type?: string
  possibleValues?: string[]
  occurrences: number
}

type ParamDefault = {
  value: string
  type?: string
  possibleValues?: string[]
}

type ParamToken = {
  name: string
  start: number
  end: number
}

const PARAM_IDENTIFIER_START = /^[A-Za-z_]$/
const PARAM_IDENTIFIER_CHAR = /^[A-Za-z0-9_]$/

const isParamIdentifierStart = (value: string | undefined) =>
  value !== undefined && PARAM_IDENTIFIER_START.test(value)

const isParamIdentifierChar = (value: string | undefined) =>
  value !== undefined && PARAM_IDENTIFIER_CHAR.test(value)

const parseTypeInfo = (typeInfo?: string): Pick<ParamDefault, 'type' | 'possibleValues'> => {
  const normalizedTypeInfo = typeInfo?.trim()

  if (!normalizedTypeInfo) {
    return {}
  }

  if (!normalizedTypeInfo.includes('|')) {
    return { type: normalizedTypeInfo }
  }

  return {
    type: 'enum',
    possibleValues: normalizedTypeInfo
      .split('|')
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
  }
}

const parseSetDirective = (
  line: string
): { name: string; value: string; type?: string; possibleValues?: string[] } | null => {
  const match = line.match(/^@set\s+([A-Za-z_][A-Za-z0-9_]*)(?::([^=]+))?\s*=\s*([^;\n]+)\s*;?$/)

  if (!match) {
    return null
  }

  const [, name, typeInfo, value] = match
  const trimmedValue = value?.trim()
  if (!trimmedValue) {
    return null
  }

  return {
    name,
    value: trimmedValue,
    ...parseTypeInfo(typeInfo),
  }
}

const extractSetDirectives = (sql: string) => {
  const defaults: Record<string, ParamDefault> = {}
  const lines = sql.split(/\r?\n/)
  const sqlWithoutSetDirectives: string[] = []

  for (const line of lines) {
    const directive = parseSetDirective(line.trimStart())
    if (!directive) {
      sqlWithoutSetDirectives.push(line)
      continue
    }

    defaults[directive.name] = {
      value: directive.value,
      type: directive.type,
      possibleValues: directive.possibleValues,
    }
  }

  return {
    defaults,
    sqlWithoutSetDirectives: sqlWithoutSetDirectives.join('\n'),
  }
}

const readDollarQuoteTag = (sql: string, startIndex: number) => {
  if (sql[startIndex] !== '$') {
    return null
  }

  let endIndex = startIndex + 1
  while (isParamIdentifierChar(sql[endIndex])) {
    endIndex += 1
  }

  if (sql[endIndex] !== '$') {
    return null
  }

  return sql.slice(startIndex, endIndex + 1)
}

const findParamTokens = (sql: string) => {
  const tokens: ParamToken[] = []

  let index = 0
  let state:
    | 'normal'
    | 'single-quote'
    | 'double-quote'
    | 'line-comment'
    | 'block-comment'
    | 'dollar-quote' = 'normal'
  let blockCommentDepth = 0
  let dollarQuoteTag: string | null = null

  while (index < sql.length) {
    const current = sql[index]

    if (state === 'single-quote') {
      if (current === "'" && sql[index + 1] === "'") {
        index += 2
        continue
      }

      if (current === '\\' && sql[index + 1] !== undefined) {
        index += 2
        continue
      }

      if (current === "'") {
        state = 'normal'
      }

      index += 1
      continue
    }

    if (state === 'double-quote') {
      if (current === '"' && sql[index + 1] === '"') {
        index += 2
        continue
      }

      if (current === '"') {
        state = 'normal'
      }

      index += 1
      continue
    }

    if (state === 'line-comment') {
      if (current === '\n' || current === '\r') {
        state = 'normal'
      }

      index += 1
      continue
    }

    if (state === 'block-comment') {
      if (current === '/' && sql[index + 1] === '*') {
        blockCommentDepth += 1
        index += 2
        continue
      }

      if (current === '*' && sql[index + 1] === '/') {
        blockCommentDepth -= 1
        index += 2
        if (blockCommentDepth === 0) {
          state = 'normal'
        }
        continue
      }

      index += 1
      continue
    }

    if (state === 'dollar-quote') {
      if (dollarQuoteTag && sql.startsWith(dollarQuoteTag, index)) {
        index += dollarQuoteTag.length
        dollarQuoteTag = null
        state = 'normal'
        continue
      }

      index += 1
      continue
    }

    if (current === "'") {
      state = 'single-quote'
      index += 1
      continue
    }

    if (current === '"') {
      state = 'double-quote'
      index += 1
      continue
    }

    if (current === '-' && sql[index + 1] === '-') {
      state = 'line-comment'
      index += 2
      continue
    }

    if (current === '/' && sql[index + 1] === '*') {
      state = 'block-comment'
      blockCommentDepth = 1
      index += 2
      continue
    }

    if (current === '$') {
      const tag = readDollarQuoteTag(sql, index)
      if (tag) {
        state = 'dollar-quote'
        dollarQuoteTag = tag
        index += tag.length
        continue
      }
    }

    if (
      current === ':' &&
      sql[index - 1] !== ':' &&
      sql[index + 1] !== ':' &&
      isParamIdentifierStart(sql[index + 1])
    ) {
      let end = index + 2
      while (isParamIdentifierChar(sql[end])) {
        end += 1
      }

      tokens.push({
        name: sql.slice(index + 1, end),
        start: index,
        end,
      })
      index = end
      continue
    }

    index += 1
  }

  return tokens
}

export const parseParameters = (sql: string | undefined) => {
  if (!sql) return []

  const { defaults, sqlWithoutSetDirectives } = extractSetDirectives(sql)
  const paramOccurrences = new Map<string, number>()

  for (const token of findParamTokens(sqlWithoutSetDirectives)) {
    paramOccurrences.set(token.name, (paramOccurrences.get(token.name) ?? 0) + 1)
  }

  return Array.from(paramOccurrences.entries()).map(([paramName, occurrences]) => ({
    name: paramName,
    value: defaults[paramName]?.value ?? '',
    defaultValue: defaults[paramName]?.value,
    type: defaults[paramName]?.type,
    possibleValues: defaults[paramName]?.possibleValues,
    occurrences,
  }))
}

export const processParameterizedSql = (sql: string, parameters: Record<string, string>) => {
  const { defaults, sqlWithoutSetDirectives } = extractSetDirectives(sql)
  const tokens = findParamTokens(sqlWithoutSetDirectives)

  if (tokens.length === 0) {
    return sqlWithoutSetDirectives
  }

  let cursor = 0
  let processedSql = ''

  for (const token of tokens) {
    processedSql += sqlWithoutSetDirectives.slice(cursor, token.start)

    const value = parameters[token.name] ?? defaults[token.name]?.value
    if (value === undefined) {
      throw new Error(`Missing value for parameter: ${token.name}`)
    }

    processedSql += value
    cursor = token.end
  }

  processedSql += sqlWithoutSetDirectives.slice(cursor)
  return processedSql
}
