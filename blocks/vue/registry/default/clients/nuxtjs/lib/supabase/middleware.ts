import { createServerClient } from '@supabase/ssr'
import { getCookie, setCookie, deleteCookie } from 'h3'
import { defineNuxtRouteMiddleware, navigateTo, useRequestEvent } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async (to) => {
  const event = useRequestEvent()

  // create Supabase SSR client directly here
  const supabase = createServerClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL!,
    process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        get: (key) => getCookie(event!, key),
        set: (key, value, options) => setCookie(event!, key, value, options),
        remove: (key, options) => deleteCookie(event!, key, options),
      },
    }
  )

  // check current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && to.path !== '/login') {
    return navigateTo('/login')
  }
})
