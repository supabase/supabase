'use client'

import { TeamSettings } from 'app/(org)/org/[slug]/team/team-setings'
import OrganizationLayout from 'app/(org)/org/layout'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
// import type { NextPageWithLayout } from 'types'

export default function TeamPage({ params }: { params: { slug: string } }) {
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()

  return selectedOrganization === undefined && isLoadingPermissions ? <Loading /> : <TeamSettings />
}

// OrgTeamSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
