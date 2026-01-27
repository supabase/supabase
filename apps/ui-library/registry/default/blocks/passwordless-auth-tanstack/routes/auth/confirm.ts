import { createClient } from '@/registry/default/clients/tanstack/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getWebRequest } from '@tanstack/react-start/server'

const confirmFn = createServerFn({ method: 'GET' })
  .validator((searchParams: unknown) => {
    if (
      searchParams &&
      typeof searchParams === 'object' &&
      'token_hash' in searchParams &&
      'type' in searchParams
    ) {
      return searchParams as Record<string, unknown>
    }
    throw new Error('Invalid search params')
  })
  .handler(async (ctx) => {
    const request = getWebRequest()

    if (!request) {
      throw redirect({ to: `/auth/error`, search: { error: 'No request' } })
    }

    const searchParams = ctx.data
    const token_hash = searchParams['token_hash'] as string
    const type = searchParams['type'] as EmailOtpType | null
    const _next = searchParams['next'] as string | undefined
    const next = _next?.startsWith('/') ? _next : '/protected'

    if (token_hash && type) {
      const supabase = createClient()

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })
      if (!error) {
        // redirect user to specified redirect URL or protected page
        throw redirect({ href: next })
      } else {
        // redirect the user to an error page with some instructions
        throw redirect({
          to: `/auth/error`,
          search: { error: error?.message },
        })
      }
    }

    // redirect the user to an error page with some instructions
    throw redirect({
      to: `/auth/error`,
      search: { error: 'No token hash or type' },
    })
  })

export const Route = createFileRoute('/auth/confirm')({
  preload: false,
  loader: (opts) => confirmFn({ data: opts.location.search }),
})
