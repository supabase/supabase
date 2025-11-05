import { RealtimePolicies } from 'components/interfaces/Realtime/Policies'
import type { NextPageWithLayout } from 'types'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="full">
      <ScaffoldSection isFullWidth>
        <RealtimePolicies />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

RealtimePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Policies">
      <PageLayout
        title="Policies"
        subtitle="Control access to your realtime channels"
        primaryActions={<DocsButton href={`${DOCS_URL}/guides/realtime/authorization`} />}
        size="large"
      >
        {page}
      </PageLayout>
    </RealtimeLayout>
  </DefaultLayout>
)

export default RealtimePoliciesPage
