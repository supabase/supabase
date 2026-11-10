import { createFileRoute } from '@tanstack/react-router'
import type { PropsWithChildren } from 'react'
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

import { DefaultEdgeFunctionSecrets } from '@/components/interfaces/Functions/EdgeFunctionSecrets/DefaultEdgeFunctionSecrets'
import { DEFAULT_EDGE_FUNCTION_SECRETS } from '@/components/interfaces/Functions/EdgeFunctionSecrets/DefaultEdgeFunctionSecrets.utils'
import { EdgeFunctionSecrets } from '@/components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import { DocsButton } from '@/components/ui/DocsButton'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/compute/secrets')({
  component: ComputeSecretsRoute,
  staticData: {
    computeLayoutTitle: 'Secrets',
  },
})

function ComputeSecretsRoute() {
  return (
    <ComputeSecretsPageWrapper>
      <ComputeSecretsPage />
    </ComputeSecretsPageWrapper>
  )
}

function ComputeSecretsPage() {
  const { isCli, isSelfHosted } = useDeploymentMode()

  if (!IS_PLATFORM) {
    return (
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent className="space-y-4 md:space-y-8">
            {isCli && (
              <Admonition
                type="default"
                title="Local development with the Supabase CLI"
                description={<p>Add custom secrets from the Supabase CLI.</p>}
              />
            )}
            {isSelfHosted && (
              <Admonition
                type="default"
                title="Self-hosted Supabase"
                description={<p>Set custom secrets via environment variables.</p>}
              />
            )}
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-foreground text-base">Default secrets</h3>
                  <p className="text-sm text-foreground-light">
                    Reserved secrets available in every project
                  </p>
                </div>
                <DocsButton href={`${DOCS_URL}/guides/functions/secrets#default-secrets`} />
              </div>
              <DefaultEdgeFunctionSecrets
                secrets={DEFAULT_EDGE_FUNCTION_SECRETS.filter((secret) => !secret.isRuntime)}
              />
            </section>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="large">
      <PageSection>
        <PageSectionContent className="space-y-4 md:space-y-8">
          <Admonition
            type="default"
            title="Secrets are shared between Edge Functions and Compute"
          />
          <EdgeFunctionSecrets />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

const ComputeSecretsPageWrapper = ({ children }: PropsWithChildren) => (
  <div className="w-full min-h-full flex flex-col items-stretch">
    <PageHeader size="large">
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>Secrets</PageHeaderTitle>
          <PageHeaderDescription>
            Environment variables loaded into every instance at start-up
          </PageHeaderDescription>
        </PageHeaderSummary>
      </PageHeaderMeta>
    </PageHeader>

    {children}
  </div>
)
