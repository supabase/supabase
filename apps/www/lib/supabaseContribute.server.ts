import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createContributeServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CONTRIBUTE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be ignored in Server Actions per Supabase docs
          }
        },
      },
    }
  )
}
