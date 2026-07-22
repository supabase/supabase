import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchClaims } from '@/lib/supabase/fetch-claims-server-fn'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const claims = await fetchClaims()

    if (!claims) {
      throw redirect({ to: '/login' })
    }

    return {
      claims,
    }
  },
})
