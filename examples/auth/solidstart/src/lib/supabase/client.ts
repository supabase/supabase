import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'

/**
 * Creates a Supabase client for browser/client-side usage.
 *
 * This client is designed for use in browser environments (client components,
 * client-side effects). It automatically manages session state and is safe to
 * use for realtime subscriptions, public data queries, and auth state monitoring.
 *
 * Note: Uses a singleton pattern internally - multiple calls return the same instance.
 *
 * @returns Supabase client configured for browser environment
 *
 * @example
 * ```tsx
 * import { getSupabaseBrowserClient } from '~/lib/supabase/client'
 *
 * export default function Messages() {
 *   const supabase = getSupabaseBrowserClient()
 *   // Use for realtime subscriptions, client-side queries, etc.
 * }
 * ```
 */
export function getSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient(url, anonKey)
}
