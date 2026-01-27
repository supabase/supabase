import { fetchUserServerFn } from '@/registry/default/blocks/passwordless-auth-tanstack/lib/supabase/fetch-user-server-fn'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const user = await fetchUserServerFn()
    if (!user) {
      throw redirect({
        to: '/passwordless',
      })
    }
    return { user }
  },
  component: () => <Outlet />,
})
