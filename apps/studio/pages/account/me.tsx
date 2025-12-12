import { AccountConnections } from 'components/interfaces/Account/Preferences/AccountConnections'
import { AccountDeletion } from 'components/interfaces/Account/Preferences/AccountDeletion'
import { AccountIdentities } from 'components/interfaces/Account/Preferences/AccountIdentities'
import { AnalyticsSettings } from 'components/interfaces/Account/Preferences/AnalyticsSettings'
import { HotkeySettings } from 'components/interfaces/Account/Preferences/HotkeySettings'
import { InlineEditorSettings } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { ProfileInformation } from 'components/interfaces/Account/Preferences/ProfileInformation'
import { ThemeSettings } from 'components/interfaces/Account/Preferences/ThemeSettings'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfile } from 'lib/profile'
import type { NextPageWithLayout } from 'types'
import { Card, CardContent } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

const User: NextPageWithLayout = () => {
  return <ProfileCard />
}

User.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout hideMobileMenu headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Account Settings">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default User

const ProfileCard = () => {
  const { profileShowInformation, profileShowAnalyticsAndMarketing, profileShowAccountDeletion } =
    useIsFeatureEnabled([
      'profile:show_information',
      'profile:show_analytics_and_marketing',
      'profile:show_account_deletion',
    ])
  const { error, isLoading, isError, isSuccess } = useProfile()

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Preferences</PageHeaderTitle>
            <PageHeaderDescription>
              Manage your account profile, connections, and dashboard experience.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
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

        <InlineEditorSettings />

        {profileShowAnalyticsAndMarketing && <AnalyticsSettings />}

        {profileShowAccountDeletion && <AccountDeletion />}
      </PageContainer>
    </>
  )
}
