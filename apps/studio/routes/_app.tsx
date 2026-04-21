import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

function AppShell() {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]?.staticData as
    | { defaultLayoutHeaderTitle?: string; hideMobileMenu?: boolean }
    | undefined

  return (
    <AppLayout>
      <DefaultLayout
        headerTitle={leaf?.defaultLayoutHeaderTitle}
        hideMobileMenu={leaf?.hideMobileMenu}
      >
        <Outlet />
      </DefaultLayout>
    </AppLayout>
  )
}
