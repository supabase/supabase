import { createClient } from '@/registry/default/clients/react-router/lib/supabase/server'
import { type LoaderFunctionArgs, redirect } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const _next = requestUrl.searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/'
  if (code) {
    const { supabase, headers } = createClient(request)

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirect(next, { headers })
    } else {
      return redirect(`/auth/error?error=${error?.message}`)
    }
  }
  // redirect the user to an error page with some instructions
  return redirect(`/auth/error`)
}
