import { redirect } from '@sveltejs/kit'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Ensure the redirect path starts with a single slash
      const redirectPath = next.startsWith('/') ? next : `/${next}`
      redirect(303, redirectPath)
    }
  }

  // Return the user to an error page with instructions
  redirect(303, '/auth/error')
}
