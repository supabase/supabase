import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import DefaultLayout from 'components/layouts/DefaultLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
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

const RealtimePoliciesPage: NextPageWithLayout = () => {
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

RealtimePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Policies">{page}</RealtimeLayout>
  </DefaultLayout>
)

export default RealtimePoliciesPage
