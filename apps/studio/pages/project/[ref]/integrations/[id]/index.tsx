import { useParams } from 'common'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { IntegrationsLayout } from 'components/layouts/Integrations/layout'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useRouter } from 'next/compat/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

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
    <PageContainer size="full">
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
