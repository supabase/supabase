import { createFileRoute } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'
import { Button } from 'ui'
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

import { Indexes } from '@/components/interfaces/Database/Indexes/Indexes'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/database/indexes')({
  component: IndexesPage,
  staticData: {
    databaseLayoutTitle: 'Indexes',
  },
})

function IndexesPage() {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Indexes</PageHeaderTitle>
            <PageHeaderDescription>
              Improve query performance against your database
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton
              className="no-underline"
              href={`${DOCS_URL}/guides/database/query-optimization`}
            />
            <Button asChild icon={<ExternalLinkIcon strokeWidth={1.5} />}>
              <a
                target="_blank"
                rel="noreferrer"
                className="no-underline"
                href={`${DOCS_URL}/guides/database/extensions/index_advisor`}
              >
                Index Advisor
              </a>
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <Indexes />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
