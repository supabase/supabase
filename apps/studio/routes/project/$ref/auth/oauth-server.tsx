import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { OAuthServerSettingsForm } from '@/components/interfaces/Auth/OAuthApps/OAuthServerSettingsForm'
import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/auth/oauth-server')({
  component: OAuthServerPage,
  staticData: {
    authLayoutTitle: 'OAuth Server',
  },
})

function OAuthServerPage() {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>OAuth Server</PageHeaderTitle>
            <PageHeaderDescription>
              Configure your project to act as an identity provider for third-party applications
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/auth/oauth-server`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <OAuthServerSettingsForm />
      </PageContainer>
    </>
  )
}
