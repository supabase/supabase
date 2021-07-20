import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants'

export let supabase: SupabaseClient

export const supabasePromise = AsyncStorage.getAllKeys()
  .then((k) => AsyncStorage.multiGet(k).then(Object.fromEntries))
  .then((keys) => {
    const storage = new LocalStorageEmulator(keys)
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      detectSessionInUrl: false,
      localStorage: storage,
    })
  })

class LocalStorageEmulator implements Storage {
  public length = 0
  private keys: Record<string, string | null> = {}

  constructor(keys: Record<string, string | null>) {
    this.keys = keys
  }

  key(n: number) {
    return Object.keys(this.keys)[n]
  }

  clear() {
    this.keys = {}
    AsyncStorage.clear()
  }

  getItem(key: string) {
    AsyncStorage.getItem(key).then((v) => (this.keys[key] = v))
    return this.keys[key]
  }

  setItem(key: string, value: string) {
    this.keys[key] = value
    AsyncStorage.setItem(key, value)
  }

  removeItem(key: string) {
    delete this.keys[key]
    AsyncStorage.removeItem(key)
  }
}
