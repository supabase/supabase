import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { EventTriggersList } from '@/components/interfaces/Database/Triggers/EventTriggersList/EventTriggersList'

export const Route = createFileRoute('/project/$ref/database/triggers/event')({
  component: TriggersSchemaPage,
})

function TriggersSchemaPage() {
  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent>
          <EventTriggersList />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
