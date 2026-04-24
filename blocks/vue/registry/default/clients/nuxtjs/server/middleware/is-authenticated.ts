import { defineNuxtRouteMiddleware, navigateTo, useRequestEvent } from 'nuxt/app'

import { createSupabaseServerClient } from '../supabase/client'

export default defineNuxtRouteMiddleware(async (to) => {
  const event = useRequestEvent()

  // create Supabase SSR client directly here
  const supabase = createSupabaseServerClient(event)

  // check current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && to.path !== '/login') {
    return navigateTo('/login')
  }
})
