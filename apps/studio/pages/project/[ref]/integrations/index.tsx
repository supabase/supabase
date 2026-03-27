import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { useParams } from 'common'
import type { NextPageWithLayout } from 'types'

import { IntegrationsCatalogPageContent } from '@/components/interfaces/Integrations/IntegrationsCatalogPageContent'
import { ProjectIntegrationsLayout } from '@/components/layouts/ProjectIntegrationsLayout'

const IntegrationsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  return (
    <IntegrationsCatalogPageContent
      hrefForIntegration={(integrationId) => `/project/${ref}/integrations/${integrationId}/overview`}
    />
  )
}

IntegrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayout>{page}</ProjectIntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationsPage
