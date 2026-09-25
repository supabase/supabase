import { RLSPlayground } from 'components/interfaces/Database/RLSPlayground'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const RLSPlaygroundPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>RLS Policy Playground</PageHeaderTitle>
            <PageHeaderDescription>
              Debug and test Row Level Security policies by simulating different user contexts.
              See exactly which rows are accessible and why policies pass or fail.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <RLSPlayground />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

RLSPlaygroundPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="RLS Playground">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default RLSPlaygroundPage
