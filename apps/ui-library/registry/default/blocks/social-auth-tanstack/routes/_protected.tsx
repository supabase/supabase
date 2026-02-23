import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchUser } from '@/registry/default/blocks/social-auth-tanstack/lib/supabase/fetch-user-server-fn'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const user = await fetchUser()

    if (!user) {
      throw redirect({ to: '/login' })
    }

    return {
      user,
    }
  },
})
