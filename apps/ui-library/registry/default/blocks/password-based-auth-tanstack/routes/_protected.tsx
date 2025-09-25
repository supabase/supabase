import { fetchUser } from '@/registry/default/blocks/password-based-auth-tanstack/lib/supabase/fetch-user-server-fn'
import { createFileRoute, redirect } from '@tanstack/react-router'

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
