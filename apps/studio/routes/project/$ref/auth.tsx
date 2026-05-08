import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'

export const Route = createFileRoute('/project/$ref/auth')({
  component: AuthShell,
})

function AuthShell() {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]?.staticData as
    | { authLayoutTitle?: string; skipAuthLayout?: boolean }
    | undefined

  // Some auth leaves wrap themselves in a sub-layout that internally
  // already includes <AuthLayout> (AuthProvidersLayout, AuthEmailsLayout,
  // and pages like third-party that inline that wrapping). Those routes
  // set `staticData.skipAuthLayout: true` and render their own Outlet
  // chain, otherwise we'd double-wrap with AuthLayout (and AuthLayout
  // pulls in withAuth + ProjectLayout, so a double-wrap is observable
  // beyond just visual nesting).
  if (leaf?.skipAuthLayout) {
    return <Outlet />
  }

  return (
    <AuthLayout title={leaf?.authLayoutTitle ?? ''}>
      <Outlet />
    </AuthLayout>
  )
}
