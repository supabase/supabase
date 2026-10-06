import { useParams } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { PublicationsAvailability } from '@/components/interfaces/Database/Publications/PublicationsAvailability'
import { PublicationsTables } from '@/components/interfaces/Database/Publications/PublicationsTables'
import { DatabaseLayout } from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const DatabasePublicationsContent = () => {
  const { ref, id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { can: canViewPublications, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_READ
  )

  const { data: publications = [], isPending } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const selectedPublication = publications.find((pub) => pub.id === Number(id))

  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <PageLayout
      title={isPending ? <ShimmeringLoader className="w-40" /> : (selectedPublication?.name ?? '')}
      breadcrumbs={[
        {
          label: 'Publications',
          href: `/project/${ref}/database/publications`,
        },
      ]}
      size="large"
    >
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <PublicationsTables />
          </PageSectionContent>
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
