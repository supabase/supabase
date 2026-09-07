import { PageContainer } from 'ui-patterns/PageContainer'

import { AuthorizedApps } from './AuthorizedApps'
import { PublishableApps } from './PublishableApps'

// [Joshen] Note on nav UX
// Kang Ming mentioned that it might be better to split Published Apps and Authorized Apps into 2 separate tabs
// to prevent any confusion (case study: GitHub). Authorized apps could be in the "integrations" tab, but let's
// check in again after we wrap up Vercel integration

export const OAuthApps = () => {
  return (
    <>
      <PageContainer size="default" className="pb-16">
        <PublishableApps />
        {/* Here we'll display the OAuth App Scoped Grants depending on the feature flag in future PRs */}
        <AuthorizedApps />
      </PageContainer>
    </>
  )
}
