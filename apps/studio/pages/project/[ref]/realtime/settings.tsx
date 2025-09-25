import type { NextPageWithLayout } from 'types'

import { RealtimeSettings } from 'components/interfaces/Realtime/RealtimeSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import RealtimeLayout from 'components/layouts/RealtimeLayout/RealtimeLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'

const RealtimePoliciesPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <RealtimeSettings />
    </ScaffoldContainer>
  )
}

RealtimePoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <RealtimeLayout title="Realtime Settings">
      <PageLayout
        title="Realtime Settings"
        subtitle="Configure your project's Realtime settings"
        // [Joshen] Scaffolding for now - once docs for this is ready
        primaryActions={<DocsButton href={`${DOCS_URL}/guides/realtime/authorization`} />}
      >
        {page}
      </PageLayout>
    </RealtimeLayout>
  </DefaultLayout>
)

export default RealtimePoliciesPage
