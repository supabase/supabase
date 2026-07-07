import { LOCAL_STORAGE_KEYS, safeLocalStorage, safeSessionStorage } from 'common'

type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[keyof typeof LOCAL_STORAGE_KEYS]
type StorageType = 'local' | 'session'

function getStorage(storageType: StorageType) {
  return storageType === 'local' ? safeLocalStorage : safeSessionStorage
}

export function store(storageType: StorageType, key: LocalStorageKey, value: string) {
  getStorage(storageType).setItem(key as string, value)
}

export function retrieve(storageType: StorageType, key: LocalStorageKey): string | null {
  return getStorage(storageType).getItem(key as string)
}

export function remove(storageType: StorageType, key: LocalStorageKey) {
  getStorage(storageType).removeItem(key as string)
}

export function storeOrRemoveNull(
  storageType: StorageType,
  key: LocalStorageKey,
  value: string | null | undefined
) {
  if (value === null || value === undefined) {
    remove(storageType, key)
  } else {
    store(storageType, key, value)
  }
}
