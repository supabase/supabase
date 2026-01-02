import { TriggersList } from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import DatabaseTriggersLayout from 'components/layouts/DatabaseLayout/DatabaseTriggersLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

export const TriggersDataPage: NextPageWithLayout = () => {
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

TriggersDataPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseTriggersLayout>{page}</DatabaseTriggersLayout>
  </DefaultLayout>
)

export default TriggersDataPage
