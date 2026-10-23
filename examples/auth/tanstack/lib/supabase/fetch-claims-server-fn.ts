import { createServerFn } from '@tanstack/react-start'

import { createClient } from '@/lib/supabase/server'

export const fetchClaims = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error) {
    return null
  }

  return data.claims
})
