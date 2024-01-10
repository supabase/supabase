export const LOCAL_STORAGE_KEYS = {
  SAVED_ORG_PROJECT_BRANCH: 'docs.ui.user.selected.org_project_branch',
} as const

type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS]

type StorageType = 'local' | 'session'

function getStorage(storageType: StorageType) {
  return storageType === 'local' ? window.localStorage : window.sessionStorage
}

export function store(storageType: StorageType, key: LocalStorageKey, value: string) {
  if (typeof window === 'undefined') return
  const storage = getStorage(storageType)

  try {
    storage.setItem(key, value)
  } catch {
    console.error(`Failed to set storage item with key "${key}"`)
  }
}

export function retrieve(storageType: StorageType, key: LocalStorageKey) {
  if (typeof window === 'undefined') return
  const storage = getStorage(storageType)
  return storage.getItem(key)
}

export function remove(storageType: StorageType, key: LocalStorageKey) {
  if (typeof window === 'undefined') return
  const storage = getStorage(storageType)
  return storage.removeItem(key)
}
