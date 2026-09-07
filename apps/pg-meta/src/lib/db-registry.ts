import { parse as parseConnectionString } from 'pg-connection-string'

export interface DatabaseConfig {
  connectionString: string
  name: string
  description?: string
  addedAt: string
}

export interface DatabaseRegistry {
  [name: string]: DatabaseConfig
}

// In-memory registry for named database connections.
// On startup, pre-configured databases are loaded from environment variables
// matching the pattern PG_META_DB_<NAME>_URL (e.g. PG_META_DB_ANALYTICS_URL).
const registry: DatabaseRegistry = {}

/**
 * Load databases from environment variables at startup.
 * Pattern: PG_META_DB_<NAME>_URL=postgres://...
 * The name is lowercased before storing.
 */
export function loadDatabasesFromEnv(): void {
  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue
    const match = key.match(/^PG_META_DB_([A-Z0-9_]+)_URL$/)
    if (match) {
      const rawName = match[1]
      const name = rawName.toLowerCase().replace(/_/g, '-')
      registry[name] = {
        name,
        connectionString: value,
        description: `Loaded from env ${key}`,
        addedAt: new Date().toISOString(),
      }
    }
  }
}

/**
 * Register a named database connection.
 * Returns an error string if the name is invalid or already exists (use upsert=true to overwrite).
 */
export function registerDatabase(
  name: string,
  connectionString: string,
  description?: string,
  upsert = false
): { error?: string } {
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    return { error: 'Database name must be lowercase alphanumeric with hyphens, starting with a letter or digit' }
  }
  if (!connectionString) {
    return { error: 'connectionString is required' }
  }
  // Validate the connection string is parseable
  try {
    parseConnectionString(connectionString)
  } catch (err: any) {
    return { error: `Invalid connection string: ${err.message}` }
  }
  if (registry[name] && !upsert) {
    return { error: `Database '${name}' is already registered. Use upsert=true to overwrite.` }
  }
  registry[name] = {
    name,
    connectionString,
    description,
    addedAt: new Date().toISOString(),
  }
  return {}
}

/**
 * Remove a named database from the registry.
 */
export function unregisterDatabase(name: string): boolean {
  if (!registry[name]) return false
  delete registry[name]
  return true
}

/**
 * Retrieve the config for a named database.
 */
export function getDatabaseConfig(name: string): DatabaseConfig | undefined {
  return registry[name]
}

/**
 * List all registered databases (without exposing full connection strings for security).
 */
export function listDatabases(): Array<Omit<DatabaseConfig, 'connectionString'> & { host?: string; database?: string }> {
  return Object.values(registry).map((db) => {
    let host: string | undefined
    let database: string | undefined
    try {
      const parsed = parseConnectionString(db.connectionString)
      host = parsed.host ?? undefined
      database = parsed.database ?? undefined
    } catch {
      // ignore parse errors in listing
    }
    return {
      name: db.name,
      description: db.description,
      addedAt: db.addedAt,
      host,
      database,
    }
  })
}

/**
 * Check if a database name is registered.
 */
export function hasDatabaseConfig(name: string): boolean {
  return name in registry
}