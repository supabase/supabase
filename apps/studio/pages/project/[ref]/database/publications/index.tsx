import { PermissionAction } from '@supabase/shared-types/out/constants'

import { PublicationsList } from 'components/interfaces/Database/Publications/PublicationsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const DatabasePublications: NextPageWithLayout = () => {
  const { can: canViewPublications, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'publications'
  )

  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Publications</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <PublicationsList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabasePublications.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabasePublications
