/**
 * Validates and returns required Supabase environment variables.
 *
 * Performs runtime validation to ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are present before creating Supabase clients. Provides clear error messages if
 * any required variable is missing or invalid.
 *
 * @returns {{ url: string; anonKey: string }} Validated Supabase configuration
 * @throws {Error} If VITE_SUPABASE_URL is missing or not a string
 * @throws {Error} If VITE_SUPABASE_ANON_KEY is missing or not a string
 *
 * @example
 * ```ts
 * const { url, anonKey } = getSupabaseConfig()
 * const client = createBrowserClient(url, anonKey)
 * ```
 */
export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || typeof url !== 'string') {
    throw new Error(
      'Missing environment variable: VITE_SUPABASE_URL. ' +
      'Please add it to your .env file.'
    )
  }

  if (!anonKey || typeof anonKey !== 'string') {
    throw new Error(
      'Missing environment variable: VITE_SUPABASE_ANON_KEY. ' +
      'Please add it to your .env file.'
    )
  }

  return { url, anonKey }
}
