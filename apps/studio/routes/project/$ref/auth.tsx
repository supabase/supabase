import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'

export const Route = createFileRoute('/project/$ref/auth')({
  component: AuthShell,
})

function AuthShell() {
  // Read the two staticData fields via `select` so the shell only re-renders
  // when the actual selected values change. See routes/_app.tsx for why the
  // bare `useMatches()` form is unsafe here.
  const skipAuthLayout = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { skipAuthLayout?: boolean } | undefined)
        ?.skipAuthLayout ?? false,
  })
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { authLayoutTitle?: string } | undefined)
        ?.authLayoutTitle ?? '',
  })

  // Some auth leaves wrap themselves in a sub-layout that internally already
  // includes <AuthLayout> (AuthProvidersLayout, AuthEmailsLayout, and pages
  // like third-party that inline that wrapping). Those routes set
  // `staticData.skipAuthLayout: true` and render their own Outlet chain;
  // otherwise we'd double-wrap with AuthLayout (and AuthLayout pulls in
  // withAuth + ProjectLayout, so a double-wrap is observable beyond just
  // visual nesting).
  if (skipAuthLayout) {
    return <Outlet />
  }

  return (
    <AuthLayout title={title}>
      <Outlet />
    </AuthLayout>
  )
}
