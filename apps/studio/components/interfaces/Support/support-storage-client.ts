import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const createSupportStorageClient = (): SupabaseClient => {
  const SUPPORT_API_URL = process.env.NEXT_PUBLIC_SUPPORT_API_URL || ''
  const SUPPORT_API_KEY = process.env.NEXT_PUBLIC_SUPPORT_ANON_KEY || ''

  return createClient(SUPPORT_API_URL, SUPPORT_API_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      // @ts-expect-error
      multiTab: false,
      detectSessionInUrl: false,
      localStorage: {
        getItem: (_key: string) => undefined,
        setItem: (_key: string, _value: string) => {},
        removeItem: (_key: string) => {},
      },
    },
  })
}
