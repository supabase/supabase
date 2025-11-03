import { createClient } from '@/registry/default/clients/react-router/lib/supabase/server'
import { type ActionFunctionArgs, redirect } from 'react-router'

export async function loader({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request)

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  // Redirect to dashboard or home page after successful sign-in
  return redirect('/', { headers })
}
