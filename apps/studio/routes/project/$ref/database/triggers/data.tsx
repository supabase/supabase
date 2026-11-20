import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { TriggersList } from '@/components/interfaces/Database/Triggers/TriggersList/TriggersList'

export const Route = createFileRoute('/project/$ref/database/triggers/data')({
  component: TriggersDataPage,
})

function TriggersDataPage() {
  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent>
          <TriggersList />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
