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
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfile } from 'lib/profile'
import type { NextPageWithLayout } from 'types'
import { Card, CardContent, CardFooter, cn } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'


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
  const { error, isLoading, isError } = useProfile()

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
        {isError && (
          <Card>
            <CardContent className="p-4">
              <AlertError error={error} subject="Failed to retrieve account information" />
            </CardContent>
          </Card>
        )}

        {!isError && (
          <>
            {isLoading ? (
              <>
                {profileShowInformation && (
                  <Card className="mt-10 mb-4">
                    <CardContent>
                      <ShimmeringLoader className="w-1/2 h-4" />
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardContent className="space-y-6">
                    <ShimmeringLoader className="p-6" />
                    <ShimmeringLoader className="p-6" />
                    <ShimmeringLoader className="p-6" />
                    <ShimmeringLoader className="p-6" />
                  </CardContent>
                  <CardFooter>
                    <ShimmeringLoader className="mr-0 ml-auto w-12 h-5 rounded-md" />
                  </CardFooter>
                </Card>
              </>
            ) : (
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
          </>
        )}
      </PageContainer>
    </>
  )
}
