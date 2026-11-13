import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useFlag } from 'common'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

export const Route = createFileRoute('/project/$ref/integrations/$id/')({
  component: IntegrationPage,
})

const INTEGRATION_FLAGS: Record<string, string> = {
  grafana: 'grafanaDashboardIntegrationEnabled',
  resend: 'resendDashboardIntegrationEnabled',
  aikido: 'aikidoDashboardIntegrationEnabled',
  doppler: 'dopplerDashboardIntegrationEnabled',
}

function IntegrationPage() {
  const navigate = useNavigate()
  const { ref, id } = Route.useParams()

  const grafanaEnabled = useFlag('grafanaDashboardIntegrationEnabled')
  const resendEnabled = useFlag('resendDashboardIntegrationEnabled')
  const aikidoEnabled = useFlag('aikidoDashboardIntegrationEnabled')
  const dopplerEnabled = useFlag('dopplerDashboardIntegrationEnabled')

  const integrationFlagValues: Record<string, boolean> = {
    grafana: grafanaEnabled,
    resend: resendEnabled,
    aikido: aikidoEnabled,
    doppler: dopplerEnabled,
  }

  useEffect(() => {
    const flagName = id ? INTEGRATION_FLAGS[id] : undefined
    if (flagName !== undefined && integrationFlagValues[id] === false) {
      void navigate({ to: '/project/$ref/integrations', params: { ref }, replace: true })
      return
    }

    void navigate({
      to: '/project/$ref/integrations/$id/$pageId',
      params: { ref, id, pageId: 'overview' },
      replace: true,
    })
  }, [navigate, ref, id, grafanaEnabled, resendEnabled, aikidoEnabled, dopplerEnabled])

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
