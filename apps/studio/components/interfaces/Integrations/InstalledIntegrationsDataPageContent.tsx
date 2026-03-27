'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent, PageSectionMeta, PageSectionSummary, PageSectionTitle } from 'ui-patterns/PageSection'
import AlertError from 'components/ui/AlertError'
import {
  IntegrationCard,
  IntegrationLoadingCard,
} from 'components/interfaces/Integrations/Landing/IntegrationCard'
import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'

export function InstalledIntegrationsDataPageContent() {
  const params = useParams()
  const projectRef = params?.projectRef as string | undefined

  const { installedIntegrations, error, isLoading, isSuccess, isError } = useInstalledIntegrations()
  if (!projectRef) return null

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionMeta>
          <Button asChild type="default" icon={<Plus size={14} strokeWidth={1.5} />}>
            <Link href={`/v2/project/${projectRef}/data/integrations/add`}>Add integration</Link>
          </Button>
        </PageSectionMeta>
        <PageSectionContent>
          <PageSectionSummary>
            <PageSectionTitle>Installed integrations</PageSectionTitle>
          </PageSectionSummary>
          <div className="grid @xl:grid-cols-3 @6xl:grid-cols-4 gap-4 mt-4">
            {isLoading &&
              ['a', 'b', 'c', 'd'].map((key) => (
                <IntegrationLoadingCard key={`integration-loading-${key}`} />
              ))}
            {isError && (
              <AlertError
                className="@xl:col-span-3 @6xl:col-span-4"
                subject="Failed to retrieve installed integrations"
                error={error}
              />
            )}
            {isSuccess && installedIntegrations.length === 0 && (
              <div className="@xl:col-span-3 @6xl:col-span-4 w-full h-[110px] border rounded flex items-center justify-center">
                <p className="text-sm text-foreground-light">No integrations installed yet</p>
              </div>
            )}
            {isSuccess &&
              installedIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  {...integration}
                  href={`/v2/project/${projectRef}/data/integrations/${integration.id}/overview`}
                  isInstalled
                />
              ))}
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
