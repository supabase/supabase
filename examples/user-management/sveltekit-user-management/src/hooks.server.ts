// src/hooks.server.ts
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public'
import { createServerClient } from '@supabase/ssr'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      /**
       * Note: You have to add the `path` variable to the
       * set and remove method due to sveltekit's cookie API
       * requiring this to be set, setting the path to `/`
       * will replicate previous/standard behaviour (https://kit.svelte.dev/docs/types#public-types-cookies)
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

  /**
   * Unlike `supabase.auth.getSession`, which is unsafe on the server because it
   * doesn't validate the JWT, this function validates the JWT by first calling
   * `getClaims` and aborts early if the JWT signature is invalid.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { claims },
      error,
    } = await event.locals.supabase.auth.getClaims()
    if (error || !claims?.sub) {
      return { session: null, user: null }
    }

    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    if (!session || session.user.id !== claims.sub) {
      return { session: null, user: null }
    }

    return { session, user: session.user }
  }
  return resolve(event, {
    filterSerializedResponseHeaders(name: string) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}
