import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { PageContainer, PageSection, PageSectionContent, ShimmeringLoader } from 'ui-patterns'

import { PublicationsTables } from '@/components/interfaces/Database/Publications/PublicationsTables'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from '@/types'

const DatabasePublications: NextPageWithLayout = () => {
  const { ref, id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { can: canViewPublications, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'publications'
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

DatabasePublications.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Publications">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabasePublications
