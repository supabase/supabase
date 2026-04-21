import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import OrganizationLayout from '@/components/layouts/OrganizationLayout'

export const Route = createFileRoute('/_app/org')({
  component: OrgShell,
})

function OrgShell() {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]?.staticData as { orgLayoutTitle?: string } | undefined

  return (
    <OrganizationLayout title={leaf?.orgLayoutTitle ?? ''}>
      <Outlet />
    </OrganizationLayout>
  )
}
