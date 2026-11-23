import { isEmpty } from 'lodash'

// Index of the first match outside parentheses/brackets and quoted strings.
function findTopLevelIndex(
  value: string,
  matches: (source: string, index: number) => boolean
): number {
  let depth = 0
  let quote: "'" | '"' | null = null

  for (let index = 0; index < value.length; index++) {
    const char = value[index]

    if (quote !== null) {
      if (char === quote) {
        if (value[index + 1] === quote) index++
        else quote = null
      }
      continue
    }

    if (char === "'" || char === '"') {
      quote = char
      continue
    }

    if (char === '(' || char === '[') {
      depth++
      continue
    }
    if (char === ')' || char === ']') {
      depth = Math.max(depth - 1, 0)
      continue
    }
    if (depth === 0 && matches(value, index)) return index
  }

  return -1
}

// Splits on top-level separators only, ignoring separators nested inside
// parentheses/brackets or inside single- or double-quoted strings.
function splitTopLevel(value: string, separator: string): string[] {
  const parts: string[] = []
  let rest = value

  while (true) {
    const index = findTopLevelIndex(rest, (source, i) => source[i] === separator)
    if (index === -1) {
      parts.push(rest)
      return parts
    }
    parts.push(rest.slice(0, index))
    rest = rest.slice(index + 1)
  }
}

function stripArgModePrefix(value: string) {
  return value.replace(/^\s*IN\s+/i, '')
}

/**
 * Procedures expose their arguments with explicit `IN` mode prefixes
 * (e.g. "IN a integer, IN b integer"); strip them so they read like functions.
 * `INOUT`/`VARIADIC` are left intact since `IN\s+` requires whitespace after `IN`.
 */
export function stripInArgModePrefixes(value: string) {
  if (!value) return value
  return splitTopLevel(value, ',').map(stripArgModePrefix).join(', ')
}

// Splits an argument into its declaration and optional default clause. The
// default can be introduced by `DEFAULT` or `=`, and may itself contain commas.
function splitArgumentDefault(value: string) {
  const index = findTopLevelIndex(value, (source, i) => {
    if (source[i] === '=') return true
    return /^default\b/i.test(source.slice(i)) && (i === 0 || /\s/.test(source[i - 1]))
  })
  if (index === -1) return { declaration: value, defaultValue: undefined }

  const separatorLength = value[index] === '=' ? 1 : 7
  return {
    declaration: value.slice(0, index),
    defaultValue: value.slice(index + separatorLength).trim(),
  }
}

// Splits the first token (the argument name) from the rest (the type). The
// name may be double-quoted and contain spaces; the type keeps its remaining
// words and modifiers, such as `character varying` or `numeric(10,2)`.
function splitArgumentNameAndType(value: string) {
  const index = findTopLevelIndex(value, (source, i) => /\s/.test(source[i]))
  if (index === -1) return null

  const name = value.slice(0, index).trim()
  const type = value.slice(index + 1).trim()
  return name && type ? { name, type } : null
}

function parseArgument(value: string) {
  const { declaration, defaultValue } = splitArgumentDefault(value.trim())
  const parsed = splitArgumentNameAndType(declaration)
  if (!parsed) return null

  return { ...parsed, defaultValue }
}

type FunctionArgument = { name: string; type: string; defaultValue?: string }

export function formatArgumentDeclarations(args: FunctionArgument[]) {
  return args.map((arg) =>
    arg.defaultValue
      ? `${arg.name} ${arg.type} DEFAULT ${arg.defaultValue}`
      : `${arg.name} ${arg.type}`
  )
}

/**
 * convert argument_types = "a integer, b integer"
 * to args = {value: [{name:'a', type:'integer'}, {name:'b', type:'integer'}]}
 */
export function convertArgumentTypes({
  type,
  value,
}: {
  type: 'function' | 'procedure'
  value: string
}) {
  if (isEmpty(value) || !value.trim()) return { value: [] }

  const temp = splitTopLevel(value, ',')
    .map((item) => {
      const normalized = type === 'procedure' ? stripArgModePrefix(item) : item
      const parsed = parseArgument(normalized)
      if (!parsed) {
        console.error('Error while trying to parse function arguments', normalized.trim())
      }
      return parsed
    })
    .filter(Boolean) as FunctionArgument[]

  return { value: temp }
}

/**
 * convert config_params =  {search_path: "auth, public"}
 * to {value: [{name: 'search_path', value: 'auth, public'}]}
 */
export function convertConfigParams(value: Record<string, string> | null | undefined) {
  const temp = []
  if (value) {
    for (var key in value) {
      temp.push({ name: key, value: value[key] })
    }
  }
  return { value: temp }
}

export function hasWhitespace(value: string) {
  return /\s/.test(value)
}
