import { EventTriggersList } from 'components/interfaces/Database/Triggers/EventTriggersList/EventTriggersList'
import DatabaseTriggersLayout from 'components/layouts/DatabaseLayout/DatabaseTriggersLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

export const TriggersSchemaPage: NextPageWithLayout = () => {
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

TriggersSchemaPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseTriggersLayout>{page}</DatabaseTriggersLayout>
  </DefaultLayout>
)

export default TriggersSchemaPage
