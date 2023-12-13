export const SAVED_ORG_PROJECT_BRANCH = 'docs.ui.user.selected.org_project_branch' as const

export function store(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    console.error(`Failed to set storage item with key "${key}" and value ${value}"`)
  }
}

export function retrieve(storage: Storage, key: string) {
  return storage.getItem(key)
}
