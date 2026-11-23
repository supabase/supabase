import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
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
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { NoPermission } from '@/components/ui/NoPermission'
import { DOCS_URL } from '@/lib/constants'
import { useGrant } from '@/lib/grants'

export const Route = createFileRoute('/project/$ref/database/functions')({
  component: DatabaseFunctionsPage,
  staticData: {
    databaseLayoutTitle: 'Functions',
  },
})

function DatabaseFunctionsPage() {
  const { ref: projectRef } = useParams()
  const readGrant = useGrant(
    'POST /platform/pg-meta/{ref}/query',
    { projectRef },
    { variant: 'read' }
  )

  if (readGrant.status === 'denied') {
    return <NoPermission isFullPage resourceText="view database functions" />
  }

  if (readGrant.status === 'error') {
    return (
      <AlertError
        error={readGrant.error}
        subject="Failed to check database functions permissions"
      />
    )
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
