import { EdgeFunctionVersionsList } from 'components/interfaces/Functions/EdgeFunctionVersions/edge-function-version-list'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const VersionsPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        <EdgeFunctionVersionsList />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

VersionsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout>
        <PageLayout
          size="large"
          title="Version Restoration"
          subtitle="Restore a previous version of your Edge Functions"
        >
          {page}
        </PageLayout>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default VersionsPage
