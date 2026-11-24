import type { H3Event } from 'h3'
import { defineNuxtRouteMiddleware, navigateTo, useRequestEvent } from 'nuxt/app'

import { createSupabaseServerClient } from '../supabase/client'

export default defineNuxtRouteMiddleware(async (to) => {
  // Nuxt's Nitro server provides an h3 `H3Event` here
  const event = useRequestEvent() as H3Event | undefined

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
