import { redirect } from '@sveltejs/kit'

import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Ensure the redirect path is a safe relative path
      const isSafePath = next.startsWith('/') && !next.startsWith('//')
      redirect(303, isSafePath ? next : '/')
    }
  }

  // Return the user to an error page with instructions
  redirect(303, '/auth/error')
}
