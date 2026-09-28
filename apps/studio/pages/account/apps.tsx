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
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const UserOAuthApps: NextPageWithLayout = () => {
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
  <DefaultLayout>
    <DefaultLayout headerTitle="Account">
      <AccountLayout title="OAuth Apps">{page}</AccountLayout>
    </DefaultLayout>
  </DefaultLayout>
)
export default UserOAuthApps
