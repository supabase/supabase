import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public'

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      /**
       * SvelteKit's cookies API requires `path` to be explicitly set in
       * the cookie options. Setting `path` to `/` replicates previous/
       * standard behavior.
       */
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
        if (Object.keys(headers).length > 0) {
          event.setHeaders(headers)
        }
      },
    },
  })

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  /**
   * `getClaims` validates the JWT signature locally (against the project's
   * asymmetric signing keys) without an extra round-trip to the Auth server.
   * Use this for route protection. Use `getUser()` only when you need the
   * canonical server-validated user record (e.g., after password changes).
   */
  const { data: claimsData } = await event.locals.supabase.auth.getClaims()
  event.locals.claims = claimsData?.claims ?? null

  if (!event.locals.claims && event.url.pathname.startsWith('/private')) {
    redirect(303, '/auth')
  }

  if (event.locals.claims && event.url.pathname === '/auth') {
    redirect(303, '/private')
  }

  return resolve(event)
}

export const handle: Handle = sequence(supabase, authGuard)
