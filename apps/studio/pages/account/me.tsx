import { Card, CardContent } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AccountConnections } from '@/components/interfaces/Account/Preferences/AccountConnections'
import { AccountDeletion } from '@/components/interfaces/Account/Preferences/AccountDeletion'
import { AccountIdentities } from '@/components/interfaces/Account/Preferences/AccountIdentities'
import { AnalyticsSettings } from '@/components/interfaces/Account/Preferences/AnalyticsSettings'
import { DashboardSettings } from '@/components/interfaces/Account/Preferences/DashboardSettings'
import { HotkeySettings } from '@/components/interfaces/Account/Preferences/HotkeySettings'
import { ProfileInformation } from '@/components/interfaces/Account/Preferences/ProfileInformation'
import { ThemeSettings } from '@/components/interfaces/Account/Preferences/ThemeSettings'
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { AlertError } from '@/components/ui/AlertError'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import type { NextPageWithLayout } from '@/types'

const User: NextPageWithLayout = () => {
  return IS_PLATFORM ? <PlatformPreferences /> : <SelfHostedPreferences />
}

User.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle={IS_PLATFORM ? 'Account' : 'Preferences'}>
      <AccountLayout title="Preferences">{page}</AccountLayout>
    </DefaultLayout>
  </AppLayout>
)

export default User

const PreferencesPageHeader = ({ description }: { description: string }) => (
  <PageHeader size="small">
    <PageHeaderMeta>
      <PageHeaderSummary>
        <PageHeaderTitle>Preferences</PageHeaderTitle>
        <PageHeaderDescription>{description}</PageHeaderDescription>
      </PageHeaderSummary>
    </PageHeaderMeta>
  </PageHeader>
)

const PlatformPreferences = () => {
  const { profileShowInformation, profileShowAnalyticsAndMarketing, profileShowAccountDeletion } =
    useIsFeatureEnabled([
      'profile:show_information',
      'profile:show_analytics_and_marketing',
      'profile:show_account_deletion',
    ])
  const { error, isLoading, isError, isSuccess } = useProfile()

  return (
    <>
      <PreferencesPageHeader description="Manage your account profile, connections, and dashboard experience." />
      <PageContainer size="small">
        {isLoading && (
          <Card>
            <CardContent className="p-4">
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card>
            <CardContent className="p-4">
              <AlertError error={error} subject="Failed to retrieve account information" />
            </CardContent>
          </Card>
        )}

        {isSuccess && (
          <>
            {profileShowInformation ? <ProfileInformation /> : null}
            <AccountIdentities />
          </>
        )}

        <AccountConnections />

        <ThemeSettings />

        <HotkeySettings />

        <DashboardSettings />

        {profileShowAnalyticsAndMarketing && <AnalyticsSettings />}

        {profileShowAccountDeletion && <AccountDeletion />}
      </PageContainer>
    </>
  )
}

const SelfHostedPreferences = () => {
  return (
    <>
      <PreferencesPageHeader description="Manage how the dashboard looks and behaves on this browser and device." />
      <PageContainer size="small">
        <ThemeSettings />

        <HotkeySettings />

        <DashboardSettings />
      </PageContainer>
    </>
  )
}
