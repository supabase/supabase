import { redirect, type ActionFunctionArgs } from 'react-router'

import { createClient } from '@/registry/default/clients/react-router/lib/supabase/server'

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
