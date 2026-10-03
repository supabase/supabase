// Tiny leaf module holding the vector-store DB name + URL derivation helper.
// Lives outside the migrations folder so the HTTP plugin can import it
// without pulling the migration runner (and its CLI side effects + heavy
// transitive deps) into request-path startup.

export const VECTOR_DATABASE_NAME = 'storage_vectors'

/**
 * Derive the runtime vector-store connection string from a maintenance URL
 * by swapping the database name to `storage_vectors`. Used by both the
 * migration runner (after creating the dedicated DB) and the request-time
 * vector plugin (to open its pool).
 */
export function deriveVectorDatabaseUrl(maintenanceUrl: string): string {
  const u = new URL(maintenanceUrl)
  u.pathname = `/${VECTOR_DATABASE_NAME}`
  return u.toString()
}
