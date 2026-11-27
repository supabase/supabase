import { useFeatureFlags, useFlag, useParams } from 'common'
import { useQueryState } from 'nuqs'
import { PageContainer } from 'ui-patterns/PageContainer'

import { AuthorizedApps } from './AuthorizedApps'
import { OAuthAppsAuthorizedList } from './OAuthAppsAuthorizedList'
import { PublishableApps } from './PublishableApps'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

// [Joshen] Note on nav UX
// Kang Ming mentioned that it might be better to split Published Apps and Authorized Apps into 2 separate tabs
// to prevent any confusion (case study: GitHub). Authorized apps could be in the "integrations" tab, but let's
// check in again after we wrap up Vercel integration

export const OAuthApps = () => {
  const isScopedOAuthManageEnabled = useFlag('enableScopedOAuthManage')
  const { hasLoaded } = useFeatureFlags()
  const { mock_scenario } = useParams()
  const [accessApp, setAccessApp] = useQueryState('access_app')
  const showsDatabaseAccessPreview =
    (import.meta.env.DEV || IS_STAGING_OR_LOCAL) &&
    mock_scenario === 'trusted_partner_authorized_apps'
  return (
    <>
      <PageContainer size="default" className="pb-16">
        <PublishableApps />
        {showsDatabaseAccessPreview ? (
          <OAuthAppsAuthorizedList
            isPreview
            accessApp={accessApp}
            onCloseLinkedAccess={() => void setAccessApp(null)}
          />
        ) : hasLoaded ? (
          isScopedOAuthManageEnabled ? (
            <OAuthAppsAuthorizedList />
          ) : (
            <AuthorizedApps />
          )
        ) : null}
      </PageContainer>
    </>
  )
}
