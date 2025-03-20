import { createBrowserClient } from '@supabase/ssr'

// Use this function to create a client for the browser. You should pass the env variables through a loader and use them
// to instantiate the client.
export function createClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
