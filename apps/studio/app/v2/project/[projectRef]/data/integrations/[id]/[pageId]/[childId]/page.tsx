'use client'

import { useParams } from 'next/navigation'

import { IntegrationDetailPageContent } from '@/components/interfaces/Integrations/IntegrationDetailPageContent'

import { V2IntegrationRouteShell } from '../../V2IntegrationRouteShell'

export default function DataIntegrationChildDetailPage() {
  const params = useParams()
  const projectRef = params?.projectRef as string | undefined
  const base = `/v2/project/${projectRef}/data/integrations`

  return (
    <V2IntegrationRouteShell>
      <IntegrationDetailPageContent
        routePrefix={base}
        listHref={base}
        showHeader={false}
        allowWrapperGuard={false}
      />
    </V2IntegrationRouteShell>
  )
}
