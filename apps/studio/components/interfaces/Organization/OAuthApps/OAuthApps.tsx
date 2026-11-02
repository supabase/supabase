import { useFeatureFlags, useFlag } from 'common'
import { PageContainer } from 'ui-patterns/PageContainer'

import { AuthorizedApps } from './AuthorizedApps'
import { OAuthAppsAuthorizedList } from './OAuthAppsAuthorizedList'
import { PublishableApps } from './PublishableApps'
import { USE_MOCKS } from '@/data/oauth-apps/mocks'

// [Joshen] Note on nav UX
// Kang Ming mentioned that it might be better to split Published Apps and Authorized Apps into 2 separate tabs
// to prevent any confusion (case study: GitHub). Authorized apps could be in the "integrations" tab, but let's
// check in again after we wrap up Vercel integration

export const OAuthApps = () => {
  const areOAuthAppScopedGrantsEnabled = useFlag('OauthAppScopedGrants')
  const { hasLoaded } = useFeatureFlags()
  const shouldShowNewOAuthApps = areOAuthAppScopedGrantsEnabled && USE_MOCKS
  return (
    <>
      <PageContainer size="default" className="pb-16">
        <PublishableApps />
        {hasLoaded ? (
          shouldShowNewOAuthApps ? (
            <OAuthAppsAuthorizedList />
          ) : (
            <AuthorizedApps />
          )
        ) : null}
      </PageContainer>
    </>
  )
}
