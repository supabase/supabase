import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useFeatureFlags, useFlag } from 'common'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { OAuthApps } from '@/components/interfaces/Account/OAuthApps/OAuthApps'
import { USE_MOCKS } from '@/data/oauth-apps/mocks'

export const Route = createFileRoute('/_app/account/apps')({
  component: AccountOAuthAppsPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'OAuth Apps',
  },
})

function AccountOAuthAppsPage() {
  const isScopedOAuthManageEnabled = useFlag('enableScopedOAuthManage') && USE_MOCKS
  const { hasLoaded } = useFeatureFlags()
  const navigate = useNavigate()
  useEffect(() => {
    if (hasLoaded && !isScopedOAuthManageEnabled) {
      void navigate({ href: '/404', replace: true })
    }
  }, [hasLoaded, isScopedOAuthManageEnabled, navigate])

  if (!hasLoaded || !isScopedOAuthManageEnabled) {
    return null
  }

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>OAuth Apps</PageHeaderTitle>
            <PageHeaderDescription>View and manage your personal grants</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="small">
        <OAuthApps />
      </PageContainer>
    </>
  )
}
