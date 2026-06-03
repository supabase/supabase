import { Admonition } from 'ui-patterns/admonition'
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
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionsLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const SecretsPage: NextPageWithLayout = () => {
  const { isCli, isSelfHosted } = useDeploymentMode()

  if (isSelfHosted) {
    return (
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent className="space-y-4 md:space-y-8">
            <Admonition
              type="default"
              title="Secrets are written to volumes/functions/.env"
              description={
                <p>
                  Point the <code className="text-code-inline">functions</code> service at this file
                  via <code className="text-code-inline">env_file</code> and restart it to apply
                  changes — unlike function code, environment variables are not hot-reloaded.
                </p>
              }
              actions={
                <DocsButton
                  href={`${DOCS_URL}/guides/self-hosting/self-hosted-functions#custom-environment-variables`}
                />
              }
            />
            <EdgeFunctionSecrets />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    )
  }

  if (!IS_PLATFORM) {
    return (
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent className="space-y-4 md:space-y-8">
            {isCli && (
              <Admonition
                type="default"
                title="Local development with the Supabase CLI"
                description={
                  <p>
                    Add custom secrets to{' '}
                    <code className="text-code-inline">supabase/functions/.env</code>, or pass{' '}
                    <code className="text-code-inline">--env-file</code> to{' '}
                    <code className="text-code-inline">supabase functions serve</code>.
                  </p>
                }
                actions={<DocsButton href={`${DOCS_URL}/guides/functions/secrets#using-the-cli`} />}
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

SecretsPage.getLayout = (page) => {
  return (
    <DefaultLayout>
      <EdgeFunctionsLayout title="Secrets">
        <div className="w-full min-h-full flex flex-col items-stretch">
          <PageHeader size="large">
            <PageHeaderMeta>
              <PageHeaderSummary>
                <PageHeaderTitle>Edge Function Secrets</PageHeaderTitle>
                <PageHeaderDescription>
                  Manage encrypted values for your functions
                </PageHeaderDescription>
              </PageHeaderSummary>
            </PageHeaderMeta>
          </PageHeader>

          {page}
        </div>
      </EdgeFunctionsLayout>
    </DefaultLayout>
  )
}

export default SecretsPage
