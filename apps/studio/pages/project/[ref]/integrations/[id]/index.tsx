import { useFlag, useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectIntegrationsLayoutDispatch } from '@/components/layouts/ProjectIntegrationsLayoutDispatch'
import type { NextPageWithLayout } from '@/types'

const INTEGRATION_FLAGS: Record<string, string> = {
  grafana: 'grafanaDashboardIntegrationEnabled',
  resend: 'resendDashboardIntegrationEnabled',
  aikido: 'aikidoDashboardIntegrationEnabled',
  doppler: 'dopplerDashboardIntegrationEnabled',
}

const IntegrationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = useParams()

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
    if (!router?.isReady) return

    const flagName = id ? INTEGRATION_FLAGS[id] : undefined
    if (flagName !== undefined && integrationFlagValues[id!] === false) {
      router.replace(`/project/${ref}/integrations`)
      return
    }

    router.replace(`/project/${ref}/integrations/${id}/overview`)
  }, [router, ref, id, grafanaEnabled, resendEnabled, aikidoEnabled, dopplerEnabled])

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
    <ProjectIntegrationsLayoutDispatch>{page}</ProjectIntegrationsLayoutDispatch>
  </DefaultLayout>
)

export default IntegrationPage
