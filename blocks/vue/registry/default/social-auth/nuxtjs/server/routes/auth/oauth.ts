import { defineEventHandler, getQuery, getRequestURL, sendRedirect } from 'h3'

import { createSupabaseServerClient } from '@/registry/default/clients/nuxtjs/server/supabase/client'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event) // URL object of the current request
  const query = getQuery(event)

  const code = query.code as string | undefined
  let next = (query.next as string | undefined) ?? '/'

  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = createSupabaseServerClient(event)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Determine origin
      const forwardedHost = event.node.req.headers['x-forwarded-host'] as string | undefined
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const origin = `${url.protocol}//${url.host}`

      if (isLocalEnv) {
        return sendRedirect(event, `${origin}${next}`)
      } else if (forwardedHost) {
        return sendRedirect(event, `https://${forwardedHost}${next}`)
      } else {
        return sendRedirect(event, `${origin}${next}`)
      }
    }
  }

  // fallback to error page
  const origin = `${url.protocol}//${url.host}`
  return sendRedirect(event, `${origin}/auth/error`)
})
