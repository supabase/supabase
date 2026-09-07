/**
 * Self-hosted database registry helpers.
 *
 * Reads from the JSON registry file mounted at DATABASE_REGISTRY_PATH
 * (defaults to docker/volumes/registry/databases.json) and provides typed
 * access to per-database configuration.
 */

import { readFileSync } from 'fs'
import path from 'path'

export interface DatabaseEntry {
  ref: string
  name: string
  host: string
  port: number
  database: string
  password_env: string
  jwt_secret_env: string
  anon_key_env?: string
  service_key_env?: string
  created_at?: string
}

export interface DatabaseRegistry {
  version: string
  databases: DatabaseEntry[]
}

function registryPath(): string {
  return (
    process.env.DATABASE_REGISTRY_PATH ??
    path.join(process.cwd(), 'docker/volumes/registry/databases.json')
  )
}

/** Read and parse the registry file. Throws when the file is missing or invalid JSON. */
export function readDatabaseRegistry(): DatabaseRegistry {
  const raw = readFileSync(registryPath(), 'utf-8')
  return JSON.parse(raw) as DatabaseRegistry
}

function loadRegistry(): DatabaseRegistry {
  try {
    return readDatabaseRegistry()
  } catch {
    return { version: '1', databases: [] }
  }
}

/** Returns all registered databases. */
export function getAllDatabases(): DatabaseEntry[] {
  return loadRegistry().databases
}

/** Alias for getAllDatabases() — used by some callers. */
export function getDatabases(): DatabaseEntry[] {
  return getAllDatabases()
}

/** Find a database by its ref slug. Returns null when not found. */
export function getDatabaseByRef(ref: string): DatabaseEntry | null {
  return loadRegistry().databases.find((db) => db.ref === ref) ?? null
}

/**
 * Read an environment variable by name. Returns empty string when unset.
 */
export function getEnvValue(envKey: string | undefined): string {
  if (!envKey) return ''
  return process.env[envKey] ?? ''
}
