export const LOCAL_STORAGE_KEYS_ALLOWLIST = ['graphiql:theme', 'theme', 'supabaseDarkMode']

export function clearLocalStorage() {
  for (const key in localStorage) {
    if (!LOCAL_STORAGE_KEYS_ALLOWLIST.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}
