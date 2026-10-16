/**
 * Parses a one-dimensional Postgres array literal of identifiers (e.g. the text form of a
 * `name[]` value) into its elements.
 *
 * Postgres double-quotes elements that contain spaces, commas, braces, quotes or backslashes
 * (e.g. `{"User ID",id}`), escaping embedded `"` and `\` with a backslash. Splitting on commas
 * alone would keep those quotes and split names that contain commas.
 */
export function parsePostgresIdentifierArray(value: string): string[] {
  const inner = value.trim().replace(/^\{/, '').replace(/\}$/, '')
  if (inner.length === 0) return []

  const elements: string[] = []
  let current = ''
  let isQuoted = false

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i]

    if (isQuoted) {
      if (char === '\\') {
        current += inner[++i] ?? ''
      } else if (char === '"') {
        isQuoted = false
      } else {
        current += char
      }
    } else if (char === '"') {
      isQuoted = true
    } else if (char === ',') {
      elements.push(current)
      current = ''
    } else {
      current += char
    }
  }
  elements.push(current)

  return elements
}
