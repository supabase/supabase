/**
 * Validates and returns required Supabase environment variables.
 * Throws a descriptive error if any variable is missing.
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
