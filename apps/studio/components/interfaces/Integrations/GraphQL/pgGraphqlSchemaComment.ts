/**
 * Helpers for parsing and updating the pg_graphql configuration directive that
 * lives inside a Postgres schema comment.
 *
 * pg_graphql reads its per-schema configuration from a directive of the form:
 *
 *   @graphql({"introspection": true, "inflect_names": true})
 *
 * embedded anywhere in the schema comment. There is at most one such directive
 * per schema; if the user has set arbitrary other comment text alongside it,
 * we preserve that text when rewriting the directive.
 */

export type GraphqlOptions = Record<string, unknown>

export type ParsedSchemaComment = {
  /** Options parsed from the directive. Empty object when no directive exists. */
  options: GraphqlOptions
  /** True if a recognizable `@graphql(...)` directive was found. */
  hasDirective: boolean
  /** True if a directive was found but its JSON body could not be parsed. */
  isMalformed: boolean
  /** Text before the directive (empty when there is none). */
  prefix: string
  /** Text after the directive (empty when there is none). */
  suffix: string
}

type DirectiveLocation = {
  /** Index of the `@` that starts the directive. */
  start: number
  /** Index after the matching `)`. */
  end: number
  /** Index of the opening `{` of the JSON body. */
  jsonStart: number
  /** Index after the matching `}` of the JSON body. */
  jsonEnd: number
}

/**
 * Locate a single `@graphql(...)` directive in the given text. Returns null if
 * no syntactically well-formed directive is found.
 *
 * The matcher walks JSON strings character-by-character so that braces inside
 * string values (e.g. `"label": "}{"`) don't confuse the balance counter.
 */
const findDirective = (text: string): DirectiveLocation | null => {
  const directiveMatch = /@graphql\s*\(/.exec(text)
  if (!directiveMatch) return null

  const start = directiveMatch.index
  let i = start + directiveMatch[0].length

  // Skip whitespace between `(` and the opening `{`.
  while (i < text.length && /\s/.test(text[i])) i++
  if (text[i] !== '{') return null

  const jsonStart = i
  let depth = 0
  let inString = false
  let escape = false

  for (; i < text.length; i++) {
    const c = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (inString) {
      if (c === '\\') escape = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') {
      inString = true
    } else if (c === '{') {
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) {
        const jsonEnd = i + 1
        // Skip whitespace between `}` and the closing `)`.
        let j = jsonEnd
        while (j < text.length && /\s/.test(text[j])) j++
        if (text[j] !== ')') return null
        return { start, end: j + 1, jsonStart, jsonEnd }
      }
    }
  }
  return null
}

export const parseSchemaComment = (comment: string | null | undefined): ParsedSchemaComment => {
  const text = comment ?? ''
  const location = findDirective(text)

  if (!location) {
    return {
      options: {},
      hasDirective: false,
      isMalformed: false,
      prefix: text,
      suffix: '',
    }
  }

  const json = text.slice(location.jsonStart, location.jsonEnd)
  let options: GraphqlOptions = {}
  let isMalformed = false
  try {
    const parsed = JSON.parse(json)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      options = parsed as GraphqlOptions
    } else {
      isMalformed = true
    }
  } catch {
    isMalformed = true
  }

  return {
    options,
    hasDirective: true,
    isMalformed,
    prefix: text.slice(0, location.start),
    suffix: text.slice(location.end),
  }
}

/**
 * Produce an updated schema comment string with `overrides` merged into the
 * directive's options. Any surrounding comment text is preserved. When the
 * existing directive is malformed, its options are discarded and replaced by
 * `overrides` alone.
 */
export const buildSchemaCommentWith = (
  comment: string | null | undefined,
  overrides: GraphqlOptions
): string => {
  const parsed = parseSchemaComment(comment)
  const baseOptions = parsed.isMalformed ? {} : parsed.options
  const merged: GraphqlOptions = { ...baseOptions, ...overrides }
  const directive = `@graphql(${JSON.stringify(merged)})`

  if (!parsed.hasDirective) {
    // Preserve any prior text; insert the directive at the end with a single
    // space separator if the prior text is non-empty.
    const existing = parsed.prefix
    if (existing.length === 0) return directive
    return existing.endsWith(' ') ? `${existing}${directive}` : `${existing} ${directive}`
  }

  return `${parsed.prefix}${directive}${parsed.suffix}`
}

/**
 * Returns true when the parsed options explicitly set `introspection: true`.
 * Every other value (including missing, `false`, or non-boolean) is treated as
 * "introspection not enabled" so callers can show the opt-in notice.
 */
export const isIntrospectionEnabled = (options: GraphqlOptions): boolean => {
  return options.introspection === true
}

/**
 * Returns true when the installed pg_graphql version is >= 1.6.0, which is the
 * first version that disables introspection by default.
 *
 * Accepts standard `MAJOR.MINOR.PATCH` strings; pre-release / build suffixes
 * are ignored. Returns false on unparseable input so older / unknown
 * installations fall back to the legacy "introspection on by default" behavior.
 */
export const isPgGraphqlIntrospectionOptIn = (version: string | null | undefined): boolean => {
  if (!version) return false
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?/.exec(version)
  if (!match) return false
  const major = Number(match[1])
  const minor = Number(match[2])
  if (Number.isNaN(major) || Number.isNaN(minor)) return false
  if (major > 1) return true
  if (major < 1) return false
  return minor >= 6
}
