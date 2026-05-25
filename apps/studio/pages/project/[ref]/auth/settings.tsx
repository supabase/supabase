import { IS_PLATFORM } from 'common'
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

import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const AuthSettingsPage: NextPageWithLayout = () => {
  const { isCli, isSelfHosted } = useDeploymentMode()

  if (IS_PLATFORM) return null

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Auth Settings</PageHeaderTitle>
            <PageHeaderDescription>
              Sign-in, OAuth, session, limits, MFA, SAML SSO, URLs
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent className="space-y-4">
            {isCli && (
              <Admonition
                type="default"
                title="Local development with the Supabase CLI"
                description={
                  <p>
                    Auth settings are configured in{' '}
                    <code className="text-code-inline">supabase/config.toml</code>.
                  </p>
                }
                actions={<DocsButton href={`${DOCS_URL}/guides/local-development/cli/config`} />}
              />
            )}
            {isSelfHosted && (
              <Admonition
                type="default"
                title="Self-hosted Supabase"
                description={
                  <p>
                    Auth settings are configured via environment variables.
                  </p>
                }
                actions={<DocsButton href={`${DOCS_URL}/guides/self-hosting`} />}
              />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

AuthSettingsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout title="Auth Settings">{page}</AuthLayout>
  </DefaultLayout>
)

export default AuthSettingsPage
