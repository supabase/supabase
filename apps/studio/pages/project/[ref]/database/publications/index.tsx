import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection } from 'ui-patterns/PageSection'

import { PublicationsAvailability } from '@/components/interfaces/Database/Publications/PublicationsAvailability'
import { PublicationsList } from '@/components/interfaces/Database/Publications/PublicationsList'
import { DatabaseLayout } from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import type { NextPageWithLayout } from '@/types'
import { useAsyncCheckPermissionsV2, FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'

const DatabasePublicationsContent = () => {
  const { can: canViewPublications, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_READ
  )

  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <PageLayout title="Database Publications" size="large">
      <PageContainer size="large">
        <PageSection className="gap-y-4">
          <PublicationsList />
        </PageSection>
      </PageContainer>
    </PageLayout>
  )
}

const DatabasePublications: NextPageWithLayout = () => (
  <PublicationsAvailability>
    <DatabasePublicationsContent />
  </PublicationsAvailability>
)

DatabasePublications.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Publications">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabasePublications
