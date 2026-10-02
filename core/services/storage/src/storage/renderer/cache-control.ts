/**
 * Splits a Cache-Control field value into its top-level directives.
 *
 * Per RFC 9111 §5.2 / RFC 9110 §5.6.4, a directive value may be a
 * quoted-string, which can itself contain commas and backslash-escaped
 * characters (e.g. `private="Set-Cookie, X-Foo"`)
 */
function splitCacheControlDirectives(value: string): string[] {
  const directives: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < value.length; i++) {
    const char = value[i]

    if (inQuotes && char === '\\' && i + 1 < value.length) {
      current += char + value[i + 1]
      i++
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      current += char
      continue
    }

    if (char === ',' && !inQuotes) {
      const trimmed = current.trim()
      if (trimmed.length > 0) {
        directives.push(trimmed)
      }
      current = ''
      continue
    }

    current += char
  }

  const trimmed = current.trim()
  if (trimmed.length > 0) {
    directives.push(trimmed)
  }

  return directives
}

function cacheControlDirectiveName(directive: string): string {
  const separatorIndex = directive.indexOf('=')
  const name = separatorIndex === -1 ? directive : directive.slice(0, separatorIndex)
  return name.trim().toLowerCase()
}

/**
 * Combines a base set of Cache-Control directives with additional ones,
 * skipping any addition whose directive name is already present in the base
 */
export function mergeCacheControlDirectives(
  base: Array<string | undefined>,
  additions: readonly string[]
) {
  if (additions.length === 0) {
    return base
  }

  const directives = base.filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  )

  const directiveNames = new Set(
    directives.flatMap((directive) =>
      splitCacheControlDirectives(directive).map(cacheControlDirectiveName)
    )
  )

  for (const addition of additions) {
    const name = cacheControlDirectiveName(addition)
    if (!directiveNames.has(name)) {
      directives.push(addition)
      directiveNames.add(name)
    }
  }

  return directives
}
