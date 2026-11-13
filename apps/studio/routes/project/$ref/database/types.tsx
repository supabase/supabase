import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { EnumeratedTypes } from '@/components/interfaces/Database/EnumeratedTypes/EnumeratedTypes'

export const Route = createFileRoute('/project/$ref/database/types')({
  component: DatabaseEnumeratedTypes,
  staticData: {
    databaseLayoutTitle: 'Enumerated Types',
  },
})

function DatabaseEnumeratedTypes() {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Database Enumerated Types</PageHeaderTitle>
            <PageHeaderDescription>
              Custom data types that you can use in your database tables or functions
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <EnumeratedTypes />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
