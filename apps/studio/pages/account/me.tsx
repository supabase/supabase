import { AccountInformation, AnalyticsSettings } from 'components/interfaces/Account/Preferences'
import { AccountDeletion } from 'components/interfaces/Account/Preferences/AccountDeletion'
import { ProfileInformation } from 'components/interfaces/Account/Preferences/ProfileInformation'
import { ThemeSettings } from 'components/interfaces/Account/Preferences/ThemeSettings'
import AccountLayout from 'components/layouts/AccountLayout/account-layout'
import AccountSettingsLayout from 'components/layouts/AccountLayout/account-settings-layout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfile } from 'lib/profile'
import type { NextPageWithLayout } from 'types'

const User: NextPageWithLayout = () => {
  return <ProfileCard />
}

User.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
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
    </DefaultLayout>
  </AppLayout>
)

export default User

const ProfileCard = () => {
  const profileUpdateEnabled = useIsFeatureEnabled('profile:update')
  const { profile, error, isLoading, isError, isSuccess } = useProfile()

  return (
    <article className="max-w-4xl">
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
