import { type EmailOtpType } from '@supabase/supabase-js'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { safeNextPath } from '@/registry/default/blocks/safe-next-path/lib/safe-next-path'
import { createClient } from '@/registry/default/clients/tanstack/lib/supabase/server'

const confirmFn = createServerFn({ method: 'GET' })
  .inputValidator((searchParams: unknown) => {
    if (
      searchParams &&
      typeof searchParams === 'object' &&
      'token_hash' in searchParams &&
      'type' in searchParams &&
      'next' in searchParams
    ) {
      return searchParams
    }
    throw new Error('Invalid search params')
  })
  .handler(async (ctx) => {
    const request = getRequest()

    if (!request) {
      throw redirect({ to: `/auth/error`, search: { error: 'No request' } })
    }

    const searchParams = ctx.data
    const token_hash = searchParams['token_hash'] as string
    const type = searchParams['type'] as EmailOtpType | null
    const _next = searchParams['next'] as string
    const origin = new URL(request.url).origin
    const next = safeNextPath(
      _next?.startsWith(`${origin}/`) ? _next.slice(origin.length) : _next,
      '/',
      origin
    )

    if (token_hash && type) {
      const supabase = createClient()

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })
      console.log(error?.message)
      if (!error) {
        // redirect user to specified redirect URL or root of app
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
