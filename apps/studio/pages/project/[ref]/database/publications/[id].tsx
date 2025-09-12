import { PermissionAction } from '@supabase/shared-types/out/constants'

import { PublicationsTables } from 'components/interfaces/Database/Publications/PublicationsTables'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const DatabasePublications: NextPageWithLayout = () => {
  const { can: canViewPublications, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'publications'
  )

  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth>
        <PublicationsTables />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabasePublications.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">
      <PageLayout title="Database Publications">{page}</PageLayout>
    </DatabaseLayout>
  </DefaultLayout>
)

export default DatabasePublications
