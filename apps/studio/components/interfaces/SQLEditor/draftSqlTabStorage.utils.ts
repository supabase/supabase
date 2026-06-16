import { LOCAL_STORAGE_KEYS } from 'common'

export type PersistedDraftSqlTab = {
  sql: string
  name: string
  updatedAt: number
}

export type DraftSqlTabStorage = Record<string, PersistedDraftSqlTab>

export function getDraftSqlTabStorageKey(projectRef: string) {
  return LOCAL_STORAGE_KEYS.SQL_EDITOR_DRAFT_TABS(projectRef)
}

export function readDraftSqlTabStorage(projectRef: string): DraftSqlTabStorage {
  if (typeof window === 'undefined' || !projectRef) return {}

  try {
    const raw = localStorage.getItem(getDraftSqlTabStorageKey(projectRef))
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }

    return parsed as DraftSqlTabStorage
  } catch {
    return {}
  }
}

export function readPersistedDraftSqlTab(
  projectRef: string,
  draftId: string
): PersistedDraftSqlTab | undefined {
  return readDraftSqlTabStorage(projectRef)[draftId]
}

function writeDraftSqlTabStorage(projectRef: string, storage: DraftSqlTabStorage) {
  try {
    localStorage.setItem(getDraftSqlTabStorageKey(projectRef), JSON.stringify(storage))
  } catch {
    return
  }
}

export function persistDraftSqlTab(
  projectRef: string,
  draftId: string,
  patch: {
    sql?: string
    name: string
  }
) {
  if (typeof window === 'undefined' || !projectRef) return

  const storage = readDraftSqlTabStorage(projectRef)
  const existing = storage[draftId]

  storage[draftId] = {
    sql: patch.sql ?? existing?.sql ?? '',
    name: patch.name,
    updatedAt: Date.now(),
  }

  writeDraftSqlTabStorage(projectRef, storage)
}

export function removePersistedDraftSqlTab(projectRef: string, draftId: string) {
  if (typeof window === 'undefined' || !projectRef) return

  const storage = readDraftSqlTabStorage(projectRef)
  if (!(draftId in storage)) return

  delete storage[draftId]
  writeDraftSqlTabStorage(projectRef, storage)
}

export function prunePersistedDraftSqlTabs(projectRef: string, openDraftIds: string[]) {
  if (typeof window === 'undefined' || !projectRef) return

  const storage = readDraftSqlTabStorage(projectRef)
  const openDraftIdSet = new Set(openDraftIds)
  let hasChanges = false

  for (const draftId of Object.keys(storage)) {
    if (!openDraftIdSet.has(draftId)) {
      delete storage[draftId]
      hasChanges = true
    }
  }

  if (hasChanges) {
    writeDraftSqlTabStorage(projectRef, storage)
  }
}
