import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { Extensions } from '@/components/interfaces/Database/Extensions/Extensions'
import { DatabaseLayout } from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'
import { useAsyncCheckPermissionsV2, FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'

const DatabaseExtensions: NextPageWithLayout = () => {
  const { can: canReadExtensions, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_READ
  )

  if (isPermissionsLoaded && !canReadExtensions) {
    return <NoPermission isFullPage resourceText="view database extensions" />
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Extensions</PageHeaderTitle>
            <PageHeaderDescription>
              Manage what extensions are installed in your database
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/database/extensions`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <Extensions />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabaseExtensions.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Extensions">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseExtensions
