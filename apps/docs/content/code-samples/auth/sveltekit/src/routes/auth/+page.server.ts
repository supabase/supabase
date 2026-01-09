import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  login: async ({ locals: { supabase }, url }) => {
    const next = url.searchParams.get('next') ?? '/dashboard'
    // Validate next parameter to prevent open redirects (must be relative, not protocol-relative)
    const isValidPath = next.startsWith('/') && !next.startsWith('//')
    const safePath = isValidPath ? next : '/dashboard'

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(safePath)}`,
      },
    })

    if (error) {
      console.error(error)
      redirect(303, '/auth/error')
    }

    if (data.url) {
      redirect(303, data.url)
    }

    redirect(303, '/auth/error')
  },

  signup: async ({ locals: { supabase }, url }) => {
    const next = url.searchParams.get('next') ?? '/dashboard'
    const isValidPath = next.startsWith('/') && !next.startsWith('//')
    const safePath = isValidPath ? next : '/dashboard'

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(safePath)}`,
      },
    })

    if (error) {
      console.error(error)
      redirect(303, '/auth/error')
    }

    if (data.url) {
      redirect(303, data.url)
    }

    redirect(303, '/auth/error')
  },

  logout: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut()
    redirect(303, '/')
  },
}
