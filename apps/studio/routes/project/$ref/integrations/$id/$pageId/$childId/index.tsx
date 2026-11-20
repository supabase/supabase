import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo } from 'react'
import { Admonition } from 'ui-patterns/Admonition'
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

import { useAvailableIntegrations } from '@/components/interfaces/Integrations/Landing/useAvailableIntegrations'
import { useInstalledIntegrations } from '@/components/interfaces/Integrations/Landing/useInstalledIntegrations'

export const Route = createFileRoute('/project/$ref/integrations/$id/$pageId/$childId/')({
  component: IntegrationPage,
})

function IntegrationPage() {
  const navigate = useNavigate()
  const { ref, id, pageId, childId } = Route.useParams()

  const { data: allIntegrations } = useAvailableIntegrations()
  const { installedIntegrations: installedIntegrations, isLoading: isIntegrationsLoading } =
    useInstalledIntegrations()

  // everything is wrapped in useMemo to avoid UI resets when installing additional extensions like pg_net
  const integration = useMemo(() => allIntegrations.find((i) => i.id === id), [allIntegrations, id])

  const installation = useMemo(
    () => installedIntegrations.find((inst) => inst.id === id),
    [installedIntegrations, id]
  )

  // Get the corresponding component dynamically
  const Component = useMemo(
    () => integration?.navigate({ id, pageId, childId }),
    [integration, id, pageId, childId]
  )

  useEffect(() => {
    // if the integration is not installed, redirect to the overview page
    if (!isIntegrationsLoading && !installation && pageId !== 'overview') {
      void navigate({
        to: '/project/$ref/integrations/$id/$pageId',
        params: { ref, id, pageId: 'overview' },
        replace: true,
      })
    }
  }, [installation, isIntegrationsLoading, pageId, navigate, ref, id])

  // Determine content based on state
  const content = useMemo(() => {
    if (isIntegrationsLoading) {
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
  }, [isIntegrationsLoading, id, integration, Component])

  return content
}
