import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'

export const Route = createFileRoute('/_app')({
  component: AppShell,
})

function AppShell() {
  // useMatches() without `select` returns a fresh array on every router
  // tick — even when the matched leaf hasn't changed — and re-renders the
  // entire shell subtree. Use the `select` form so we only re-render when
  // the values we actually consume change.
  const headerTitle = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { defaultLayoutHeaderTitle?: string } | undefined)
        ?.defaultLayoutHeaderTitle,
  })
  const hideMobileMenu = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { hideMobileMenu?: boolean } | undefined)
        ?.hideMobileMenu,
  })

  return (
    <AppLayout>
      <DefaultLayout headerTitle={headerTitle} hideMobileMenu={hideMobileMenu}>
        <Outlet />
      </DefaultLayout>
    </AppLayout>
  )
}
