import { promises as fs } from 'node:fs'
import path from 'node:path'

import {
  GOTRUE_CONFIG_RESPONSE_FIELDS,
  GOTRUE_DURATION_FIELDS,
  type GoTrueConfigFieldType,
} from './fields'

/**
 * Name of the file this store manages inside the auth config folder. It sorts
 * last alphabetically so Studio-managed values win over manually dropped
 * files, mirroring GoTrue's "later files override earlier ones" semantics.
 */
export const STUDIO_MANAGED_FILENAME = 'zz-studio.env'

const ENV_PREFIX = 'GOTRUE_'

export type AuthConfigEnvMap = Record<string, string>
export type AuthConfigPatch = Record<string, string | number | boolean | null>
export type AuthConfigResponseValues = Record<string, string | number | boolean | null>

export class AuthConfigValidationError extends Error {}

/**
 * Minimal .env parser covering the subset this store writes and godotenv
 * reads: comments, blank lines, optional `export ` prefix and single/double
 * quoted values.
 */
export function parseDotenv(content: string): AuthConfigEnvMap {
  const map: AuthConfigEnvMap = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const assignment = trimmed.startsWith('export ') ? trimmed.slice(7).trimStart() : trimmed
    const eq = assignment.indexOf('=')
    if (eq <= 0) continue

    const key = assignment.slice(0, eq).trim()
    let value = assignment.slice(eq + 1).trim()

    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value
        .slice(1, -1)
        .replace(/\\(.)/gs, (_, c) => (c === 'n' ? '\n' : c === 'r' ? '\r' : c === 't' ? '\t' : c))
    } else if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }

    map[key] = value
  }

  return map
}

function formatDotenvValue(value: string): string {
  if (value === '' || /[\s#"'\\]/.test(value)) {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    return `"${escaped}"`
  }
  return value
}

export function serializeDotenv(map: AuthConfigEnvMap): string {
  const lines = Object.keys(map)
    .sort()
    .map((key) => `${key}=${formatDotenvValue(map[key])}`)
  return lines.length > 0 ? `${lines.join('\n')}\n` : ''
}

/**
 * Mirrors the load order of GoTrue's confload loader: files are applied in
 * alphabetical order and a `base.json` takes precedence over a sibling
 * `base.env` (auth/internal/conf/confload/loader.go getPaths).
 */
export function listConfigFileNames(entries: string[]): string[] {
  const candidates = entries.filter((name) => /\.(env|json)$/.test(name)).sort()

  const names: string[] = []
  for (let i = 0; i < candidates.length; i++) {
    const current = candidates[i]
    if (current.endsWith('.env')) {
      const next = candidates[i + 1]
      if (next?.endsWith('.json') && next.slice(0, -5) === current.slice(0, -4)) {
        i++
        names.push(next)
        continue
      }
    }
    names.push(current)
  }
  return names
}

function coerceValue(value: string, type: GoTrueConfigFieldType): string | number | boolean | null {
  switch (type) {
    case 'boolean':
      if (value.toLowerCase() === 'true') return true
      if (value.toLowerCase() === 'false') return false
      return null
    case 'number': {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    default:
      return value
  }
}

const DURATION_UNITS_IN_SECONDS: Record<string, number> = {
  ns: 1e-9,
  us: 1e-6,
  µs: 1e-6,
  ms: 1e-3,
  s: 1,
  m: 60,
  h: 3600,
}

const GO_DURATION_PART = /^(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)/

/** Parses a Go duration string (`1h30m`, `10s`, `200ms`) into seconds. */
export function parseGoDuration(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '0') return 0
  if (!trimmed) return null

  let total = 0
  let rest = trimmed
  while (rest.length > 0) {
    const match = rest.match(GO_DURATION_PART)
    if (!match) return null
    total += Number(match[1]) * DURATION_UNITS_IN_SECONDS[match[2]]
    rest = rest.slice(match[0].length)
  }
  return total
}

/** Converts seconds to the unit the studio UI works in for a duration field. */
function durationSecondsToFieldValue(seconds: number, unit: 'seconds' | 'hours' | 'per_hour') {
  switch (unit) {
    case 'hours':
      return Math.round((seconds / 3600) * 1000) / 1000
    case 'per_hour':
      return seconds > 0 ? Math.round((3600 / seconds) * 1000) / 1000 : null
    default:
      return seconds
  }
}

/** Serializes a field value into its GoTrue env var representation. */
function serializeFieldValue(field: string, value: string | number | boolean): string {
  const durationUnit = GOTRUE_DURATION_FIELDS[field]
  if (durationUnit && typeof value === 'number') {
    switch (durationUnit) {
      case 'seconds':
        return `${value}s`
      case 'hours':
        return `${value}h`
      case 'per_hour':
        return `${3600 / value}s`
    }
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function validatePatch(
  patch: AuthConfigPatch,
  allowedFields: Record<string, GoTrueConfigFieldType>
) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new AuthConfigValidationError('Request body must be an object of config fields')
  }

  const unknown = Object.keys(patch).filter((field) => !(field in allowedFields))
  if (unknown.length > 0) {
    throw new AuthConfigValidationError(`Unknown config fields: ${unknown.sort().join(', ')}`)
  }

  for (const [field, value] of Object.entries(patch)) {
    if (value === null) continue
    const expected = allowedFields[field]
    const valid =
      (expected === 'boolean' && typeof value === 'boolean') ||
      (expected === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
      (expected === 'string' && typeof value === 'string')
    if (!valid) {
      throw new AuthConfigValidationError(
        `Invalid value for ${field}: expected ${expected}, got ${typeof value}`
      )
    }

    const durationUnit = GOTRUE_DURATION_FIELDS[field]
    if (durationUnit && typeof value === 'number') {
      if (value < 0 || (durationUnit === 'per_hour' && value === 0)) {
        throw new AuthConfigValidationError(
          `Invalid value for ${field}: expected a number greater than 0`
        )
      }
    }
  }
}

export class FileSystemAuthConfigStore {
  constructor(private readonly dir: string) {}

  /** Merged view of every config file in the folder (later files win). */
  async readEnvMap(): Promise<AuthConfigEnvMap> {
    let entries: string[]
    try {
      entries = (await fs.readdir(this.dir, { withFileTypes: true }))
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
    } catch (error: any) {
      if (error?.code === 'ENOENT') return {}
      throw error
    }

    const merged: AuthConfigEnvMap = {}
    for (const name of listConfigFileNames(entries)) {
      const raw = await fs.readFile(path.join(this.dir, name), 'utf8')
      Object.assign(merged, name.endsWith('.json') ? JSON.parse(raw) : parseDotenv(raw))
    }
    return merged
  }

  /** GET /platform/auth/{ref}/config response built from the folder. */
  async getConfig(): Promise<AuthConfigResponseValues> {
    const env = await this.readEnvMap()

    const config: AuthConfigResponseValues = {}
    for (const [field, type] of Object.entries(GOTRUE_CONFIG_RESPONSE_FIELDS)) {
      const raw = env[`${ENV_PREFIX}${field}`]
      if (raw === undefined) {
        config[field] = null
        continue
      }

      const durationUnit = GOTRUE_DURATION_FIELDS[field]
      if (durationUnit) {
        const seconds = parseGoDuration(raw)
        config[field] = seconds === null ? null : durationSecondsToFieldValue(seconds, durationUnit)
        continue
      }

      config[field] = coerceValue(raw, type)
    }
    return config
  }

  /**
   * Applies a partial update to the studio-managed file. Fields set to null
   * are removed from it, falling back to the container env or GoTrue defaults.
   * Returns the effective config after the update.
   */
  async updateConfig(
    patch: AuthConfigPatch,
    allowedFields: Record<string, GoTrueConfigFieldType>
  ): Promise<AuthConfigResponseValues> {
    validatePatch(patch, allowedFields)

    const managed = await this.readManagedFile()
    for (const [field, value] of Object.entries(patch)) {
      const envName = `${ENV_PREFIX}${field}`
      // Clearing a field (null, or '' for strings) removes the key so the
      // container env or GoTrue default applies again.
      if (value === null || value === '') {
        delete managed[envName]
      } else {
        managed[envName] = serializeFieldValue(field, value)
      }
    }
    await this.writeManagedFile(managed)

    return this.getConfig()
  }

  /**
   * Removes the content and subject overrides of an email template, reverting
   * it to the GoTrue built-in defaults. `templateSuffix` is the upper snake
   * case template name (e.g. EMAIL_CHANGE).
   */
  async resetTemplate(templateSuffix: string): Promise<AuthConfigResponseValues> {
    const managed = await this.readManagedFile()
    delete managed[`${ENV_PREFIX}MAILER_TEMPLATES_${templateSuffix}_CONTENT`]
    delete managed[`${ENV_PREFIX}MAILER_SUBJECTS_${templateSuffix}`]
    await this.writeManagedFile(managed)

    return this.getConfig()
  }

  private get managedPath() {
    return path.join(this.dir, STUDIO_MANAGED_FILENAME)
  }

  private async readManagedFile(): Promise<AuthConfigEnvMap> {
    try {
      return parseDotenv(await fs.readFile(this.managedPath, 'utf8'))
    } catch (error: any) {
      if (error?.code === 'ENOENT') return {}
      throw error
    }
  }

  private async writeManagedFile(map: AuthConfigEnvMap): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true })
    const tmpPath = `${this.managedPath}.${process.pid}.tmp`
    await fs.writeFile(tmpPath, serializeDotenv(map), { mode: 0o644 })
    await fs.rename(tmpPath, this.managedPath)
  }
}
