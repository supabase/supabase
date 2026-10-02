import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const files = [
    {
      name: '.env',
      language: 'bash',
      code: [
        `VITE_SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}`,
        `VITE_SUPABASE_PUBLISHABLE_KEY=${projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'}`,
        '',
      ].join('\n'),
    },
    {
      name: 'src/middleware/auth.middleware.ts',
      language: 'ts',
      code: `
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Context, MiddlewareHandler } from 'hono'
import { env } from 'hono/adapter'
import { setCookie } from 'hono/cookie'
import type { CookieOptions } from 'hono/utils/cookie'

declare module 'hono' {
  interface ContextVariableMap {
    supabase: SupabaseClient
  }
}

export const getSupabase = (c: Context) => {
  return c.get('supabase')
}

type SupabaseEnv = {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_PUBLISHABLE_KEY: string
}

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseEnv = env<SupabaseEnv>(c)
    const supabaseUrl = supabaseEnv.VITE_SUPABASE_URL ?? import.meta.env?.VITE_SUPABASE_URL
    const supabasePublishableKey =
      supabaseEnv.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL missing!')
    }

    if (!supabasePublishableKey) {
      throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY missing!')
    }

    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
      cookies: {
        getAll() {
          return parseCookieHeader(c.req.header('Cookie') ?? '')
        },
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value, options }) =>
            setCookie(c, name, value, options as CookieOptions)
          )
          Object.entries(cacheHeaders).forEach(([key, value]) => c.header(key, value))
        },
      },
    })

    c.set('supabase', supabase)

    await next()
  }
}
`,
    },
    {
      name: 'src/index.ts',
      language: 'ts',
      code: `
import { Hono } from 'hono'

import { getSupabase, supabaseMiddleware } from './middleware/auth.middleware'

const app = new Hono()

app.use('*', supabaseMiddleware())

app.get('/todos', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase.from('todos').select('*')

  if (error) {
    console.error(error)
    return c.json({ error: error.message }, 500)
  }

  return c.json(data)
})

export default app
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
