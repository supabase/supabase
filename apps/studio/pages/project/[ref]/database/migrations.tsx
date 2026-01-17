import Migrations from 'components/interfaces/Database/Migrations/Migrations'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
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

const MigrationsPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Migrations</PageHeaderTitle>
            <PageHeaderDescription>Track changes to your database over time</PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton
              className="no-underline"
              href={`${DOCS_URL}/guides/deployment/database-migrations`}
            />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <Migrations />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

MigrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Migrations">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default MigrationsPage
