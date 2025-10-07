// pages/+onBeforeRender.ts
import type { OnBeforeRenderAsync } from 'vike/types'
import { createSupabaseServerClient } from '../utils/supabase-server'

export const onBeforeRender: OnBeforeRenderAsync = async (pageContext) => {
  const { request } = pageContext

  // Create response headers to collect cookies
  const responseHeaders = new Headers()
  
  // Create Supabase client for SSR
  const supabase = createSupabaseServerClient(request, responseHeaders)

  // Get user session
  const { data: { user }, error } = await supabase.auth.getUser()

  // Add cookies to the page context so they can be sent to the browser
  const cookies = Array.from(responseHeaders.entries())
    .filter(([key]) => key.toLowerCase() === 'set-cookie')
    .map(([, value]) => value)

  return {
    pageContext: {
      user,
      supabaseError: error,
      responseCookies: cookies
    }
  }
}
