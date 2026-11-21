/**
 * TEMPORARY. Delete once Spark (turso) types the `json` that `array_to_json` returns, so
 * `policies.list`'s `roles` arrives as an array.
 *
 * Spark runs `policies.list` but returns `roles` as JSON text. Postgres rows pass through unchanged.
 */
export function withParsedPolicyRoles<T extends { roles: unknown }>(rows: T[]): T[] {
  return rows.map((row) =>
    typeof row.roles === 'string' ? { ...row, roles: JSON.parse(row.roles) } : row
  )
}
