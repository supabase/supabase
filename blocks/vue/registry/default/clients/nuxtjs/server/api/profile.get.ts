import { createError, defineEventHandler } from 'h3'

import { createSupabaseServerClient } from '../supabase/client'

export default defineEventHandler(async (event) => {
  // Create Supabase SSR client
  const supabase = createSupabaseServerClient(event)

  // Example: get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Fetch profile row
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { profile: data }
})
