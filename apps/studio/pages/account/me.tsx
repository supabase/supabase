import { AccountInformation, AnalyticsSettings } from 'components/interfaces/Account/Preferences'
import { AccountDeletion } from 'components/interfaces/Account/Preferences/AccountDeletion'
import { ProfileInformation } from 'components/interfaces/Account/Preferences/ProfileInformation'
import { ThemeSettings } from 'components/interfaces/Account/Preferences/ThemeSettings'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AccountSettingsLayout from 'components/layouts/AccountLayout/AccountSettingsLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useNewLayout } from 'hooks/ui/useNewLayout'
import { useProfile } from 'lib/profile'
import type { NextPageWithLayout } from 'types'

const User: NextPageWithLayout = () => {
  const newLayoutPreview = useNewLayout()

  if (newLayoutPreview) {
    return <ProfileCard />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>User Preferences</ScaffoldTitle>
        <ScaffoldDescription>
          Manage your profile, account settings, and preferences for your Supabase experience
        </ScaffoldDescription>
      </ScaffoldHeader>
      <ProfileCard />
    </ScaffoldContainer>
  )
}

User.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout
          title="Preferences"
          breadcrumbs={[
            {
              key: `supabase-settings`,
              label: 'Preferences',
            },
          ]}
        >
          <AccountSettingsLayout>{page}</AccountSettingsLayout>
        </AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default User

const ProfileCard = () => {
  const profileUpdateEnabled = useIsFeatureEnabled('profile:update')
  const { profile, error, isLoading, isError, isSuccess } = useProfile()

  return (
    <article>
      {isLoading && (
        <Panel>
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        </Panel>
      )}
      {isError && (
        <Panel>
          <div className="p-4">
            <AlertError error={error} subject="Failed to retrieve account information" />
          </div>
        </Panel>
      )}
      {isSuccess && (
        <>
          <section>
            <AccountInformation profile={profile} />
          </section>
          {profileUpdateEnabled && isSuccess ? <ProfileInformation profile={profile!} /> : null}
        </>
      )}

      <section>
        <ThemeSettings />
      </section>

      <section>
        <AnalyticsSettings />
      </section>

      <section>
        <AccountDeletion />
      </section>
    </article>
  )
}
