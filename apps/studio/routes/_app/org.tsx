import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import OrganizationLayout from '@/components/layouts/OrganizationLayout'

export const Route = createFileRoute('/_app/org')({
  component: OrgShell,
})

function OrgShell() {
  // `select` form: only re-render when the selected title changes, not on
  // every router tick. See routes/_app.tsx for the full rationale.
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as { orgLayoutTitle?: string } | undefined)
        ?.orgLayoutTitle ?? '',
  })

  return (
    <OrganizationLayout title={title}>
      <Outlet />
    </OrganizationLayout>
  )
}
