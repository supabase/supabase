import Indexes from 'components/interfaces/Database/Indexes/Indexes'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { ExternalLink } from 'lucide-react'

const IndexesPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        <Indexes />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

IndexesPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">
      <PageLayout
        title="Database Indexes"
        subtitle="Improve query performance against your database"
        secondaryActions={
          <>
            <DocsButton href={`${DOCS_URL}/guides/database/query-optimization`} />
            <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
              <a
                target="_blank"
                rel="noreferrer"
                className="no-underline"
                href={`${DOCS_URL}/guides/database/extensions/index_advisor`}
              >
                Index Advisor
              </a>
            </Button>
          </>
        }
        size="large"
      >
        {page}
      </PageLayout>
    </DatabaseLayout>
  </DefaultLayout>
)

export default IndexesPage
