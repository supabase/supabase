import { Card, CardContent, CardFooter } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

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
  const { error, isLoading, isError } = useProfile()

  return (
    <>
      <PreferencesPageHeader description="Manage your account profile, connections, and dashboard experience." />
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
              <ProfileLoadingSections showProfileInformation={profileShowInformation} />
            ) : (
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
          </>
        )}
      </PageContainer>
    </>
  )
}

const ProfileLoadingSections = ({
  showProfileInformation,
}: {
  showProfileInformation: boolean
}) => (
  <>
    {showProfileInformation && (
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Profile information</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent>
              <ProfileFieldLoadingRow labelWidth="w-24" />
            </CardContent>
            <CardContent>
              <ProfileFieldLoadingRow labelWidth="w-20" />
            </CardContent>
            <CardContent>
              <ProfileFieldLoadingRow labelWidth="w-28" descriptionWidth="w-48" />
            </CardContent>
            <CardContent>
              <ProfileFieldLoadingRow labelWidth="w-20" descriptionWidth="w-40" />
            </CardContent>
            <CardFooter className="justify-end">
              <ShimmeringLoader className="h-8 w-16 rounded-md py-0" />
            </CardFooter>
          </Card>
        </PageSectionContent>
      </PageSection>
    )}

    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Account identities</PageSectionTitle>
          <PageSectionDescription>
            Manage the providers linked to your Supabase account and update their details.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <ShimmeringLoader />
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  </>
)

const ProfileFieldLoadingRow = ({
  labelWidth,
  descriptionWidth,
}: {
  labelWidth: string
  descriptionWidth?: string
}) => (
  <div className="flex flex-col-reverse gap-2 md:gap-6 md:flex-row-reverse md:justify-between">
    <div className="flex flex-col justify-center items-start md:items-end shrink-0 md:w-1/2 xl:w-2/5 md:min-w-100">
      <ShimmeringLoader className="h-8 w-full rounded-md py-0" />
    </div>
    <div className="flex flex-col min-w-0 flex-grow">
      <ShimmeringLoader className={`${labelWidth} h-4 py-0`} />
      {descriptionWidth !== undefined && (
        <ShimmeringLoader className={`${descriptionWidth} mt-2 h-3 py-0`} />
      )}
    </div>
  </div>
)

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
