/**
 * Parses a one-dimensional Postgres array literal (e.g. `{id,"first name","a,b"}`) into its
 * elements.
 *
 * Postgres double-quotes array elements that contain commas, braces, double quotes, backslashes
 * or whitespace (and escapes `"` and `\` inside them with a backslash), so the literal can't be
 * split on commas. This is needed for `name[]` values such as foreign key column lists, which are
 * returned as their text representation rather than as a JSON array.
 */
export function parsePostgresArrayLiteral(literal: string): string[] {
  const trimmed = literal.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return []

  const body = trimmed.slice(1, -1)
  if (body.length === 0) return []

  const elements: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < body.length; i++) {
    const char = body[i]

    if (inQuotes) {
      if (char === '\\') {
        current += body[i + 1] ?? ''
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
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
