import { createClient } from '@supabase/supabase-js'
import { getOrRefreshTemporaryApiKey } from 'data/api-keys/temp-api-keys-utils'

/**
 * Creates a Supabase client bound to a specific project. It uses temporary API key.
 */
export async function createProjectSupabaseClient(projectRef: string, clientEndpoint: string) {
  try {
    const { apiKey } = await getOrRefreshTemporaryApiKey(projectRef)

    return createClient(clientEndpoint, apiKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (key) => {
            return null
          },
          setItem: (key, value) => {},
          removeItem: (key) => {},
        },
      },
    })
  } catch (error) {
    throw error
  }
}
