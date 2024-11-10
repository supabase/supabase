'use client'

import { GeneralSettings } from 'app/(org)/org/[slug]/general/general-settings'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

export default function GeneralPage({ params }: { params: { slug: string } }) {
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()

  return selectedOrganization === undefined && isLoadingPermissions ? (
    <Loading />
  ) : (
    <GeneralSettings />
  )
}

// OrgGeneralSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
