import { redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  login: async ({ locals: { supabase }, url }) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${url.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error(error)
      return redirect(303, '/auth/error')
    }

    return redirect(303, data.url)
  },
}
