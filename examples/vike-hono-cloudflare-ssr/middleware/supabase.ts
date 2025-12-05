import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Context, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'

declare module 'hono' {
  interface ContextVariableMap {
    supabase: SupabaseClient
    supabaseHeaders: Headers
  }
}

export const getSupabase = (c: Context) => {
  return c.get('supabase')
}

export const getSupabaseHeaders = (c: Context) => {
  return c.get('supabaseHeaders')
}

type SupabaseEnv = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c)
    const supabaseUrl = supabaseEnv.SUPABASE_URL
    const supabaseAnonKey = supabaseEnv.SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL missing!')
    }

    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_ANON_KEY missing!')
    }

    // Headers to collect cookies that need to be set
    const responseHeaders = new Headers()

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header('Cookie') ?? '')
        },
        setAll(cookiesToSet) {
          // For API routes, set cookies directly on Hono context
          cookiesToSet.forEach(({ name, value, options }) => {
            const serializedCookie = serializeCookieHeader(name, value, options)
            responseHeaders.append('Set-Cookie', serializedCookie)
            
            // Also set on Hono context for immediate availability
            try {
              c.header('Set-Cookie', serializedCookie, { append: true })
            } catch (e) {
              // Ignore if headers already sent
            }
          })
        },
      },
    })

    c.set('supabase', supabase)
    c.set('supabaseHeaders', responseHeaders)

    await next()
  }
}

// Utility to merge Supabase cookies with Vike response
export const mergeSupabaseCookies = (vikeResponse: Response, supabaseHeaders: Headers): Response => {
  // Clone the response to modify headers
  const newResponse = new Response(vikeResponse.body, {
    status: vikeResponse.status,
    statusText: vikeResponse.statusText,
    headers: vikeResponse.headers,
  })

  // Add Supabase cookies to the response
  supabaseHeaders.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      newResponse.headers.append('Set-Cookie', value)
    }
  })

  return newResponse
}
