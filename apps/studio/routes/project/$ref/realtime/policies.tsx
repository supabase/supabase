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

import { RealtimePolicies } from '@/components/interfaces/Realtime/Policies'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/realtime/policies')({
  component: RealtimePoliciesPage,
  staticData: {
    realtimeLayoutTitle: 'Policies',
  },
})

function RealtimePoliciesPage() {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Policies</PageHeaderTitle>
            <PageHeaderDescription>Control access to your realtime channels</PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/realtime/authorization`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <RealtimePolicies />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
