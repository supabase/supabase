import { createFileRoute } from '@tanstack/react-router'
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

import { Migrations } from '@/components/interfaces/Database/Migrations/Migrations'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/database/migrations')({
  component: MigrationsPage,
  staticData: {
    databaseLayoutTitle: 'Migrations',
  },
})

function MigrationsPage() {
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
