import {
  AccountInformation,
  InterfacePreviews,
  Profile,
  ThemeSettings,
} from 'components/interfaces/Account/Preferences'
import { AccountLayout } from 'components/layouts'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useFlag } from 'hooks'
import { useProfile } from 'lib/profile'
import { NextPageWithLayout } from 'types'

const User: NextPageWithLayout = () => {
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const { profile, error, isLoading, isError, isSuccess } = useProfile()

  return (
    <div className="my-2">
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
            <section>
              <Profile />
            </section>
          </>
        )}

        <section>
          <ThemeSettings />
        </section>

        {navLayoutV2 && (
          <section>
            <InterfacePreviews />
          </section>
        )}
      </article>
    </div>
  )
}

User.getLayout = (page) => (
  <AccountLayout
    title="Preferences"
    breadcrumbs={[{ key: `supabase-settings`, label: 'Preferences' }]}
  >
    {page}
  </AccountLayout>
)

export default User
