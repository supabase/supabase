import { useFeatureFlags, useFlag } from 'common'
import { useRouter } from 'next/router'
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
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const UserOAuthApps: NextPageWithLayout = () => {
  const isOAuthAppScopedGrantsEnabled = useFlag('OauthAppScopedGrants')
  const { hasLoaded } = useFeatureFlags()
  const router = useRouter()
  useEffect(() => {
    if (hasLoaded && !isOAuthAppScopedGrantsEnabled) {
      router.replace('/404')
    }
  }, [hasLoaded, isOAuthAppScopedGrantsEnabled, router])

  if (!hasLoaded || !isOAuthAppScopedGrantsEnabled) {
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

UserOAuthApps.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <AccountLayout title="OAuth Apps">{page}</AccountLayout>
    </DefaultLayout>
  </AppLayout>
)
export default UserOAuthApps
