import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') ?? '/dashboard'
    const isValidPath = next.startsWith('/') && !next.startsWith('//')
    const safePath = isValidPath ? next : '/dashboard'

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            redirect(303, safePath)
        }
    }

    // return the user to an error page with instructions
    redirect(303, '/auth/auth-code-error')
}
