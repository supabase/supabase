'use client'

import { useParams } from 'next/navigation'

import { IntegrationsCatalogPageContent } from '@/components/interfaces/Integrations/IntegrationsCatalogPageContent'

export default function DataIntegrationsAddPage() {
  const params = useParams()
  const projectRef = params?.projectRef as string | undefined
  if (!projectRef) return null
  return (
    <IntegrationsCatalogPageContent
      prioritizeAvailability
      hrefForIntegration={(integrationId) =>
        `/v2/project/${projectRef}/data/integrations/${integrationId}/overview`
      }
    />
  )
}
