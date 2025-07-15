import { LOCAL_STORAGE_KEYS } from 'common'

type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS]
type StorageType = 'local' | 'session'

function getStorage(storageType: StorageType) {
  return storageType === 'local' ? window.localStorage : window.sessionStorage
}

export function store(storageType: StorageType, key: LocalStorageKey, value: string) {
  if (typeof window === 'undefined') return
  const storage = getStorage(storageType)

  try {
    storage.setItem(key as string, value)
  } catch {
    console.error(`Failed to set storage item with key "${key}"`)
  }
}

export function retrieve(storageType: StorageType, key: LocalStorageKey) {
  if (typeof window === 'undefined') return
  const storage = getStorage(storageType)
  return storage.getItem(key as string)
}

export function remove(storageType: StorageType, key: LocalStorageKey) {
  if (typeof window === 'undefined') return
  const storage = getStorage(storageType)
  return storage.removeItem(key as string)
}

export function storeOrRemoveNull(
  storageType: StorageType,
  key: LocalStorageKey,
  value: string | null | undefined
) {
  if (typeof window === 'undefined') return
  if (value === null || value === undefined) {
    remove(storageType, key)
  } else {
    store(storageType, key, value)
  }
}
