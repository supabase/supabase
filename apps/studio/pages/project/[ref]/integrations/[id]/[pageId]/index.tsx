import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { useParams } from 'common'
import type { NextPageWithLayout } from 'types'

import { IntegrationDetailPageContent } from '@/components/interfaces/Integrations/IntegrationDetailPageContent'
import { ProjectIntegrationsLayout } from '@/components/layouts/ProjectIntegrationsLayout'

const IntegrationPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const base = `/project/${ref}/integrations`
  return <IntegrationDetailPageContent routePrefix={base} listHref={base} />
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayout>{page}</ProjectIntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
