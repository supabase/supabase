import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { FunctionsList } from '@/components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import { DatabaseLayout } from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'
import { useAsyncCheckPermissionsV2, FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'

const DatabaseFunctionsPage: NextPageWithLayout = () => {
  const { can: canReadFunctions, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_READ
  )

  if (isPermissionsLoaded && !canReadFunctions) {
    return <NoPermission isFullPage resourceText="view database functions" />
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Functions</PageHeaderTitle>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/database/functions`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <FunctionsList />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabaseFunctionsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Functions">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseFunctionsPage
