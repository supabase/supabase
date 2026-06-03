import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type FunctionSecret = {
  name: string
  /** SHA256 digest (hex) of the value — plaintext is never returned, matching the cloud API. */
  value: string
  /** ISO timestamp; the .env file's mtime (self-hosted has no per-secret timestamps). */
  updated_at?: string
}

/** Env var names: start with a letter or underscore, then alphanumerics/underscores. */
const ENV_KEY_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/

const FILE_HEADER = '# Managed by Supabase Studio — edge function secrets'

function stripWrappingQuotes(value: string): string {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Reads and writes edge function secrets as a flat `.env` file in the functions
 * management folder (mounted as `volumes/functions/.env` in the default
 * self-hosted setup). Point the `functions` service at this file via `env_file`
 * and restart it for changes to take effect — unlike code, env vars are not
 * hot-reloaded.
 */
export class FileSystemFunctionsSecretsStore {
  private readonly envPath: string

  constructor(private folderPath: string) {
    this.envPath = path.join(folderPath, '.env')
  }

  /** Parses the .env file into ordered [key, value] pairs, ignoring comments and blanks. */
  private async readEntries(): Promise<Array<[string, string]>> {
    let contents: string
    try {
      contents = await readFile(this.envPath, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }

    const entries: Array<[string, string]> = []
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (line.length === 0 || line.startsWith('#')) continue

      const separatorIndex = line.indexOf('=')
      if (separatorIndex === -1) continue

      const key = line.slice(0, separatorIndex).trim()
      if (!ENV_KEY_REGEX.test(key)) continue

      const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim())
      entries.push([key, value])
    }
    return entries
  }

  private async writeEntries(entries: Array<[string, string]>): Promise<void> {
    const body = entries.map(([key, value]) => `${key}=${value}`).join('\n')
    await writeFile(this.envPath, `${FILE_HEADER}\n${body}\n`, 'utf8')
  }

  private async fileUpdatedAt(): Promise<string | undefined> {
    try {
      const fileStat = await stat(this.envPath)
      return new Date(fileStat.mtimeMs).toISOString()
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    }
  }

  async listSecrets(): Promise<FunctionSecret[]> {
    const entries = await this.readEntries()
    const updated_at = await this.fileUpdatedAt()
    return entries.map(([name, value]) => ({ name, value: digest(value), updated_at }))
  }

  /** Inserts or replaces the given secrets, keeping existing ones intact. */
  async upsertSecrets(secrets: Array<{ name: string; value: string }>): Promise<FunctionSecret[]> {
    for (const { name, value } of secrets) {
      if (!ENV_KEY_REGEX.test(name)) {
        throw new Error(`Invalid secret name: "${name}"`)
      }
      if (/[\r\n]/.test(value)) {
        throw new Error(`Secret "${name}" value must not contain newlines`)
      }
    }

    const entries = await this.readEntries()
    const indexByKey = new Map(entries.map(([key], index) => [key, index]))

    for (const { name, value } of secrets) {
      const existingIndex = indexByKey.get(name)
      if (existingIndex === undefined) {
        indexByKey.set(name, entries.length)
        entries.push([name, value])
      } else {
        entries[existingIndex] = [name, value]
      }
    }

    await this.writeEntries(entries)
    const updated_at = await this.fileUpdatedAt()
    return secrets.map(({ name, value }) => ({ name, value: digest(value), updated_at }))
  }

  async deleteSecrets(names: string[]): Promise<void> {
    const toDelete = new Set(names)
    const entries = await this.readEntries()
    const remaining = entries.filter(([key]) => !toDelete.has(key))

    // Nothing matched — avoid rewriting the file (and resetting its mtime).
    if (remaining.length === entries.length) return

    await this.writeEntries(remaining)
  }
}
