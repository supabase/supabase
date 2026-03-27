import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { useParams } from 'common'
import type { NextPageWithLayout } from 'types'
import { IntegrationDetailPageContent } from '@/components/interfaces/Integrations/IntegrationDetailPageContent'
import { ProjectIntegrationsLayout } from '@/components/layouts/ProjectIntegrationsLayout'

const IntegrationPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  return (
    <IntegrationDetailPageContent
      routePrefix={`/project/${ref}/integrations`}
      listHref={`/project/${ref}/integrations`}
      showHeader={false}
      allowWrapperGuard={false}
    />
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayout>{page}</ProjectIntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
