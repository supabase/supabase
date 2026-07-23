import { MarketplaceIndex } from '@/components/interfaces/Integrations/Marketplace/MarketplaceIndex'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectIntegrationsLayoutDispatch } from '@/components/layouts/ProjectIntegrationsLayoutDispatch'
import type { NextPageWithLayout } from '@/types'

const IntegrationsPage: NextPageWithLayout = () => {
  return <MarketplaceIndex />
}

IntegrationsPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectIntegrationsLayoutDispatch>{page}</ProjectIntegrationsLayoutDispatch>
  </DefaultLayout>
)

export default IntegrationsPage
