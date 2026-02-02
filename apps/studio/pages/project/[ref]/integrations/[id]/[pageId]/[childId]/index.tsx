import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

import { useParams } from 'common'
import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import IntegrationsLayout from 'components/layouts/Integrations/layout'
import { useCronJobsEstimatePrefetch } from 'hooks/misc/useCronJobsEstimatePrefetch'
import type { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id, pageId, childId } = useParams()

  useCronJobsEstimatePrefetch(id)

  const { installedIntegrations: installedIntegrations, isLoading: isIntegrationsLoading } =
    useInstalledIntegrations()

  // everything is wrapped in useMemo to avoid UI resets when installing additional extensions like pg_net
  const integration = useMemo(() => INTEGRATIONS.find((i) => i.id === id), [id])

  const installation = useMemo(
    () => installedIntegrations.find((inst) => inst.id === id),
    [installedIntegrations, id]
  )

  // Get the corresponding component dynamically
  const Component = useMemo(
    () => integration?.navigate(id!, pageId, childId),
    [integration, id, pageId, childId]
  )

  useEffect(() => {
    // if the integration is not installed, redirect to the overview page
    if (
      router &&
      router?.isReady &&
      !isIntegrationsLoading &&
      !installation &&
      pageId !== 'overview'
    ) {
      router.replace(`/project/${ref}/integrations/${id}/overview`)
    }
  }, [installation, isIntegrationsLoading, pageId, router, ref, id])

  // Determine content based on state
  const content = useMemo(() => {
    if (!router?.isReady || isIntegrationsLoading) {
      return (
        <PageContainer size="full">
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    } else if (!Component || !id || !integration) {
      return (
        <PageContainer size="full">
          <PageHeader size="full">
            <PageHeaderMeta>
              <PageHeaderSummary>
                <PageHeaderTitle>Integration not found</PageHeaderTitle>
                <PageHeaderDescription>
                  If you think this is an error, please contact support.
                </PageHeaderDescription>
              </PageHeaderSummary>
            </PageHeaderMeta>
          </PageHeader>
          <PageSection>
            <PageSectionContent>
              <Admonition type="warning" title="This integration is not currently available">
                Please try again later or contact support if the problem persists.
              </Admonition>
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      )
    } else {
      return <Component />
    }
  }, [router?.isReady, isIntegrationsLoading, id, integration, Component])

  return content
}

IntegrationPage.getLayout = (page) => (
  <DefaultLayout>
    <IntegrationsLayout>{page}</IntegrationsLayout>
  </DefaultLayout>
)

export default IntegrationPage
