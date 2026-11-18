import { createFileRoute } from '@tanstack/react-router'
import { LogoLoader } from 'ui'

import { TeamSettings } from '@/components/interfaces/Organization/TeamSettings/TeamSettings'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const Route = createFileRoute('/_app/org/$slug/team')({
  component: OrgTeamSettingsPage,
  staticData: {
    orgLayoutTitle: 'Team',
  },
})

function OrgTeamSettingsPage() {
  const { isPending: isLoadingPermissions } = usePermissionsQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  return selectedOrganization === undefined && isLoadingPermissions ? (
    <LogoLoader />
  ) : (
    <TeamSettings />
  )
}
