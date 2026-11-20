import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchUser } from '@/registry/default/blocks/password-based-auth-tanstack/lib/supabase/fetch-user-server-fn'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const user = await fetchUser()

    if (!user) {
      throw redirect({ href: `/login?next=${encodeURIComponent(location.href)}` })
    }

    return {
      user,
    }
  },
})
