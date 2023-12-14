import { observer } from 'mobx-react-lite'

import {
  AccountInformation,
  AnalyticsSettings,
  ThemeSettings,
} from 'components/interfaces/Account/Preferences'
import { ProfileInformation } from 'components/interfaces/Account/Preferences/ProfileInformation'
import { AccountLayout } from 'components/layouts'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useIsFeatureEnabled } from 'hooks'
import { useProfile } from 'lib/profile'
import { NextPageWithLayout } from 'types'

const User: NextPageWithLayout = () => {
  return (
    <div className="my-2">
      <ProfileCard />
    </div>
  )
}

User.getLayout = (page) => (
  <AccountLayout
    title="Preferences"
    breadcrumbs={[
      {
        key: `supabase-settings`,
        label: 'Preferences',
      },
    ]}
  >
    {page}
  </AccountLayout>
)

export default User

const ProfileCard = observer(() => {
  const profileUpdateEnabled = useIsFeatureEnabled('profile:update')

  const { profile, error, isLoading, isError, isSuccess } = useProfile()

  return (
    <article className="max-w-4xl p-4">
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
    </article>
  )
})
