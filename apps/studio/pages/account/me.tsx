import { AccountConnections } from 'components/interfaces/Account/Preferences/AccountConnections'
import { AccountDeletion } from 'components/interfaces/Account/Preferences/AccountDeletion'
import { AccountIdentities } from 'components/interfaces/Account/Preferences/AccountIdentities'
import { AnalyticsSettings } from 'components/interfaces/Account/Preferences/AnalyticsSettings'
import { ProfileInformation } from 'components/interfaces/Account/Preferences/ProfileInformation'
import { ThemeSettings } from 'components/interfaces/Account/Preferences/ThemeSettings'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfile } from 'lib/profile'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const User: NextPageWithLayout = () => {
  return <ProfileCard />
}

User.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Account Settings">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default User

const ProfileCard = () => {
  const profileShowInformation = useIsFeatureEnabled('profile:show_information')
  const { error, isLoading, isError, isSuccess } = useProfile()

  return (
    <>
      <ScaffoldContainer>
        <FormHeader
          title="Preferences"
          description="Manage your account preferences, profile information, and personal settings."
        />
      </ScaffoldContainer>
      
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
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
              {profileShowInformation && isSuccess ? <ProfileInformation /> : null}
              <AccountIdentities />
            </>
          )}

          <section>
            <AccountConnections />
          </section>

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
      </ScaffoldContainer>
    </>
  )
}
