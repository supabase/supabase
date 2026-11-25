import { createFileRoute, Link } from '@tanstack/react-router'
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from 'ui'
import { PageBreadcrumbs } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { PublicationsTables } from '@/components/interfaces/Database/Publications/PublicationsTables'
import { NoPermission } from '@/components/ui/NoPermission'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const Route = createFileRoute('/project/$ref/database/publications/$id')({
  component: DatabasePublications,
  staticData: {
    databaseLayoutTitle: 'Publications',
  },
})

function DatabasePublications() {
  const { ref, id } = Route.useParams()
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
    <>
      <PageBreadcrumbs>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/project/$ref/database/publications" params={{ ref }}>
                Publications
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>
              {isPending ? (
                <ShimmeringLoader className="w-40" />
              ) : (
                (selectedPublication?.name ?? '')
              )}
            </PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <PublicationsTables />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
