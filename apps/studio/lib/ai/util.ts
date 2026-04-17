/**
 * LLMs sometimes emit MySQL-style `\'` escapes in SQL. PostgreSQL doesn't
 * treat backslash as an escape character, so replace `\'` → `''`.
 * Dollar-quoted strings (e.g. `$$...$$`) are left untouched.
 */
export function fixSqlBackslashEscapes(sql: string): string {
  return sql.replace(/\$([^$]*)\$[\s\S]*?\$\1\$|\\'/g, (match, dollarTag) =>
    dollarTag !== undefined ? match : "''"
  )
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
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

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
