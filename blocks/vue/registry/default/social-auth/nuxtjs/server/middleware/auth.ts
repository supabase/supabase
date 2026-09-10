import { defineEventHandler, sendRedirect } from 'h3'

import { createSupabaseServerClient } from '@/registry/default/clients/nuxtjs/server/supabase/client'

export default defineEventHandler(async (event) => {
  const supabase = createSupabaseServerClient(event)

  // Get user claims
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const pathname = event.node.req.url || '/'

  // Redirect if no user and not already on login/auth route
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/auth')) {
    return sendRedirect(event, '/auth/login')
  }

  // Return event as-is (you could return any object if needed)
  return { user }
})
