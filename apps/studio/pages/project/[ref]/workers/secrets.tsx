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
// Secrets are project-level, so workers read the same values as Edge Functions; this page
// is a separate entry point into that shared list, not a separate store.
import { EdgeFunctionSecrets } from '@/components/interfaces/Functions/EdgeFunctionSecrets/EdgeFunctionSecrets'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { WorkersLayout } from '@/components/layouts/WorkersLayout/WorkersLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const WorkerSecretsPage: NextPageWithLayout = () => {
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
          <EdgeFunctionSecrets />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

// Hoisted out of `getLayout` so the TanStack route can import it directly.
export const WorkerSecretsPageWrapper = ({ children }: PropsWithChildren) => (
  <div className="w-full min-h-full flex flex-col items-stretch">
    <PageHeader size="large">
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>Secrets</PageHeaderTitle>
          <PageHeaderDescription>
            Environment variables loaded into every worker at start-up
          </PageHeaderDescription>
        </PageHeaderSummary>
      </PageHeaderMeta>
    </PageHeader>

    {children}
  </div>
)

WorkerSecretsPage.getLayout = (page) => (
  <DefaultLayout>
    <WorkersLayout title="Secrets">
      <WorkerSecretsPageWrapper>{page}</WorkerSecretsPageWrapper>
    </WorkersLayout>
  </DefaultLayout>
)

export default WorkerSecretsPage
