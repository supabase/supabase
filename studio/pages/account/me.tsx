import { observer } from 'mobx-react-lite'
import Link from 'next/link'

import { useTheme } from 'common'
import { AccountLayout } from 'components/layouts'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import Panel from 'components/ui/Panel'
import { useProfileUpdateMutation } from 'data/profile/profile-update-mutation'
import { Profile as ProfileType } from 'data/profile/types'
import { useStore } from 'hooks'
import { useSession } from 'lib/auth'
import { useProfile } from 'lib/profile'
import { NextPageWithLayout } from 'types'
import { Button, IconMoon, IconSun, Input, Listbox, Toggle } from 'ui'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useEffect, useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'

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
  const { profile, error, isLoading, isError, isSuccess } = useProfile()
  const { mutate: updateProfile, isLoading: isUpdating } = useProfileUpdateMutation({
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
    updateProfile({
      firstName: model.first_name,
      lastName: model.last_name,
    })
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
            <Profile profile={profile} />
          </section>
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

const Profile = ({ profile }: { profile?: ProfileType }) => {
  const session = useSession()

  return (
    <Panel
      title={
        <h5 key="panel-title" className="mb-0">
          Account Information
        </h5>
      }
    >
      <Panel.Content>
        <div className="space-y-2">
          <Input
            readOnly
            disabled
            label="Username"
            layout="horizontal"
            value={profile?.username ?? ''}
          />
          <Input
            readOnly
            disabled
            label="Email"
            layout="horizontal"
            value={profile?.primary_email ?? ''}
          />
          {session?.user.app_metadata.provider === 'email' && (
            <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4">
              <div className="flex flex-col space-y-2 col-span-4 ">
                <p className="text-scale-1100 break-all">Password</p>
              </div>
              <div className="col-span-8">
                <Link href="/reset-password">
                  <a>
                    <Button type="default" size="medium">
                      Reset password
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Panel.Content>
    </Panel>
  )
}

const ThemeSettings = observer(() => {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <Panel title={<h5 key="panel-title">Theme</h5>}>
      <Panel.Content>
        <Listbox
          value={isDarkMode ? 'dark' : 'light'}
          label="Interface theme"
          descriptionText="Choose a theme preference"
          layout="horizontal"
          style={{ width: '50%' }}
          icon={isDarkMode ? <IconMoon /> : <IconSun />}
          onChange={(themeOption: any) => toggleTheme(themeOption === 'dark')}
        >
          {/* [Joshen] Removing system default for now, needs to be supported in useTheme from common packages */}
          {/* <Listbox.Option label="System default" value="system">
            System default
          </Listbox.Option> */}
          <Listbox.Option label="Dark" value="dark">
            Dark
          </Listbox.Option>
          <Listbox.Option label="Light" value="light">
            Light
          </Listbox.Option>
        </Listbox>
      </Panel.Content>
    </Panel>
  )
})

const AnalyticsSettings = observer(() => {
  const snap = useAppStateSnapshot()

  const onToggleOptIn = () => {
    const value = !snap.isOptedInTelemetry ? 'true' : 'false'
    snap.setIsOptedInTelemetry(value === 'true')
  }

  return (
    <Panel title={<h5 key="panel-title">Analytics</h5>}>
      <Panel.Content>
        <Toggle
          checked={snap.isOptedInTelemetry}
          onChange={onToggleOptIn}
          label="Opt-in to send telemetry data from the dashboard"
          descriptionText="By opting into sending telemetry data, Supabase can improve the overall dashboard user experience"
        />
      </Panel.Content>
    </Panel>
  )
})
