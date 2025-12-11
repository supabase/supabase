import DefaultLayout from 'components/layouts/DefaultLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { RealtimeSettings } from 'components/interfaces/Realtime/RealtimeSettings'
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

const RealtimeSettingsPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Realtime Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Configure your project's Realtime settings
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/realtime/settings`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <RealtimeSettings />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

RealtimeSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Realtime Settings">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default RealtimeSettingsPage
