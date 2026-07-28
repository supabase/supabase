import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

export type StateEntry = {
  inputHash: string
  syncedAt: string
  defaultBranchSha?: string
  llmModel?: string
}

export type SyncState = {
  version: 1
  entries: Record<string, StateEntry>
}

export function computeInputHash(parts: Array<string | undefined | null>): string {
  const hash = createHash('sha256')
  for (const part of parts) {
    hash.update(part ?? '')
    hash.update('\0')
  }
  return `sha256:${hash.digest('hex')}`
}

export async function readSyncState(path: string): Promise<SyncState> {
  try {
    const contents = await readFile(path, 'utf-8')
    const parsed = JSON.parse(contents) as SyncState
    if (parsed.version !== 1) {
      console.warn(`State file at ${path} has unexpected version ${parsed.version}; ignoring.`)
      return { version: 1, entries: {} }
    }
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { version: 1, entries: {} }
    }
    throw error
  }
}

export async function writeSyncState(path: string, state: SyncState): Promise<void> {
  const sorted: SyncState = {
    version: 1,
    entries: Object.fromEntries(
      Object.entries(state.entries).sort(([a], [b]) => a.localeCompare(b))
    ),
  }
  await writeFile(path, JSON.stringify(sorted, null, 2) + '\n', 'utf-8')
}

export function shouldSkip(
  state: SyncState,
  slug: string,
  inputHash: string,
  flags: { refresh: boolean; only?: Set<string> }
): boolean {
  if (flags.refresh) return false
  if (flags.only && !flags.only.has(slug)) return true
  return state.entries[slug]?.inputHash === inputHash
}
