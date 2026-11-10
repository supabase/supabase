import { LITERALS_AND_COMMENTS, stripLiteralsAndComments } from '@/data/sql/utils'

/**
 * LLMs sometimes emit MySQL-style `\'` escapes in SQL. PostgreSQL doesn't
 * treat backslash as an escape character, so replace `\'` → `''`.
 * Dollar-quoted strings (e.g. `$$...$$`) are left untouched.
 *
 * SQL that can't contain a misescaped quote is returned unchanged, so a valid
 * literal ending in a backslash, like `'\'` in `replace(path, '\', '/')`, isn't
 * rewritten into a different string.
 */
export function fixSqlBackslashEscapes(sql: string): string {
  if (!hasMisescapedQuote(sql)) return sql
  return sql.replace(/\$([^$]*)\$[\s\S]*?\$\1\$|\\'/g, (match, dollarTag) =>
    dollarTag !== undefined ? match : "''"
  )
}

/**
 * True when the SQL only makes sense if a `\'` was meant as an escaped quote. In
 * PostgreSQL a `\'` ends a '..' string, so `'it\'s'` scans as the string `'it\'`
 * followed by stray text. That shows up as a quote or backslash outside every
 * literal and comment, or as a string ending in a backslash that runs straight
 * into a word character.
 */
function hasMisescapedQuote(sql: string): boolean {
  if (/['\\]/.test(stripLiteralsAndComments(sql))) return true

  return Array.from(sql.matchAll(LITERALS_AND_COMMENTS)).some((match) => {
    const literal = match[0]
    const nextChar = sql.charAt(match.index + literal.length)
    return literal.startsWith("'") && literal.endsWith("\\'") && /\w/.test(nextChar)
  })
}

/**
 * Selects a key from weighted choices using consistent hashing
 * on an input string.
 *
 * The same input always returns the same key, with distribution
 * proportional to the provided weights.
 *
 * @example
 * const region = await selectWeightedKey('my-unique-id', {
 *   use1: 40,
 *   use2: 10,
 *   usw2: 10,
 *   euc1: 10,
 * })
 * // Returns one of the keys based on the input and weights
 */
export async function selectWeightedKey<T extends string>(
  input: string,
  weights: Record<T, number>
): Promise<T> {
  const keys = Object.keys(weights) as T[]
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource)

  // Use first 4 bytes (32 bit integer)
  const hashInt = new DataView(hashBuffer).getUint32(0)

  const totalWeight = keys.reduce((sum, key) => sum + weights[key], 0)

  let cumulativeWeight = 0
  const targetWeight = hashInt % totalWeight

  for (const key of keys) {
    cumulativeWeight += weights[key]
    if (cumulativeWeight > targetWeight) {
      return key
    }
  }

  return keys[0]
}
