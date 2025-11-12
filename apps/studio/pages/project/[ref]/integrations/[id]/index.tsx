import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useRouter } from 'next/compat/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()

  useEffect(() => {
    // Always redirect to the overview page since this route should not render content
    if (router?.isReady) {
      router.replace(`/project/${ref}/integrations/${id}/overview`)
    }
  }, [router, ref, id])

  return (
    <ScaffoldContainer size="full">
      <ScaffoldSection isFullWidth>
        <GenericSkeletonLoader />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
