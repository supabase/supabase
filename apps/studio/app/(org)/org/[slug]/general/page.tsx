'use client'

import { GeneralSettings } from 'app/(org)/org/[slug]/general/general-settings'
// import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'

export default function GeneralPage({ params }: { params: { slug: string } }) {
  // const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  // const selectedOrganization = useSelectedOrganization()

  return (
    <>
      <GeneralSettings />
    </>
  )
}

// OrgGeneralSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
