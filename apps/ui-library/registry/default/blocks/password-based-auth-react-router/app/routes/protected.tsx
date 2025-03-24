import { redirect } from 'react-router'
import { InfoIcon } from 'lucide-react'

import { createClient } from '@/registry/default/clients/react-router/lib/supabase.server'
import type { Route } from '../+types/root'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { supabase } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to sign-in page if user is not authenticated
  if (!user) {
    return redirect('/sign-in')
  }

  return { user }
}

const ProtectedPage = ({ loaderData }: Route.ComponentProps) => {
  const { user } = loaderData

  return (
    <div className="flex-1 w-full flex flex-col gap-12 max-w-5xl mx-auto">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default ProtectedPage
