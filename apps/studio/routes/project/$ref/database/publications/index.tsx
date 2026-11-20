import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection } from 'ui-patterns/PageSection'

import { PublicationsList } from '@/components/interfaces/Database/Publications/PublicationsList'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export const Route = createFileRoute('/project/$ref/database/publications/')({
  component: DatabasePublications,
  staticData: {
    databaseLayoutTitle: 'Publications',
  },
})

function DatabasePublications() {
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
