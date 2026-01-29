import { redirect } from '@sveltejs/kit'
import type { Provider } from '@supabase/supabase-js'

import type { Actions } from './$types'

export const actions: Actions = {
  signup: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      console.error(error)
      redirect(303, '/auth/error')
    } else {
      redirect(303, '/')
    }
  },
  login: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.error(error)
      redirect(303, '/auth/error')
    } else {
      redirect(303, '/private')
    }
  },
  oauth: async ({ request, locals: { supabase }, url }) => {
    const formData = await request.formData()
    const providerValue = formData.get('provider')

    // Validate provider is a non-empty string
    if (!providerValue || typeof providerValue !== 'string') {
      console.error('Invalid provider')
      redirect(303, '/auth/error')
    }

    const provider = providerValue as Provider

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${url.origin}/auth/callback`,
      },
    })

    if (error || !data.url) {
      console.error(error)
      redirect(303, '/auth/error')
    }

    redirect(303, data.url)
  },
}
