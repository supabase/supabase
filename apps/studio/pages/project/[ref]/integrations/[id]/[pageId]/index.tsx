import { useParams } from 'common'
import dynamic from 'next/dynamic'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { NextPageWithLayout } from 'types'
import { IntegrationPageHandler } from '../IntegrationPageHandler'

const IntegrationPage: NextPageWithLayout = () => {
  const { id, pageId } = useParams()

  // Get the corresponding component dynamically
  if (!id) {
    return <div>Not found</div>
  }

  const Component = IntegrationPageHandler()

  if (!Component) return <div>Not found</div>

  return <Component />
}

IntegrationPage.getLayout = (page) => <IntegrationsLayout>{page}</IntegrationsLayout>

export default IntegrationPage
