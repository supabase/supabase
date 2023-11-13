import { observer } from 'mobx-react-lite'

import {
  AccountInformation,
  AnalyticsSettings,
  ThemeSettings,
} from 'components/interfaces/Account/Preferences'
import { AccountLayout } from 'components/layouts'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProfileUpdateMutation } from 'data/profile/profile-update-mutation'
import { useIsFeatureEnabled, useStore } from 'hooks'
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
  const { ui } = useStore()

  const profileUpdateEnabled = useIsFeatureEnabled('profile:update')

  const { profile, error, isLoading, isError, isSuccess } = useProfile()
  const { mutateAsync: updateProfile, isLoading: isUpdating } = useProfileUpdateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: 'Successfully saved profile' })
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: "Couldn't update profile. Please try again later.",
      })
    },
  })

  const updateUser = async (model: any) => {
    try {
      await updateProfile({
        firstName: model.first_name,
        lastName: model.last_name,
      })
    } finally {
    }
  }

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
          {profileUpdateEnabled && (
            <section>
              {/* @ts-ignore */}
              <SchemaFormPanel
                title="Profile"
                schema={{
                  type: 'object',
                  required: [],
                  properties: {
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                  },
                }}
                model={{
                  first_name: profile?.first_name ?? '',
                  last_name: profile?.last_name ?? '',
                }}
                onSubmit={updateUser}
                loading={isUpdating}
              />
            </section>
          )}
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
