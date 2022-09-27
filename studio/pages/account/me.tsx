import React from 'react'
import { observer } from 'mobx-react-lite'
import { IconMoon, IconSun, Input, Listbox } from '@supabase/ui'

import { useProfile, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AccountLayout } from 'components/layouts'
import Panel from 'components/ui/Panel'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
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
    title="Supabase"
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
  const { mutateProfile } = useProfile()
  const user = ui.profile

  const updateUser = async (model: any) => {
    try {
      const updatedUser = await post(`${API_URL}/profile/update`, model)
      mutateProfile(updatedUser, false)
      ui.setProfile(updatedUser)
      ui.setNotification({ category: 'success', message: 'Successfully saved profile' })
    } catch (error) {
      ui.setNotification({
        error,
        category: 'error',
        message: "Couldn't update profile. Please try again later.",
      })
    }
  }

  return (
    <article className="max-w-4xl p-4">
      <section>
        <GithubProfile />
      </section>
      <section className="">
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
            first_name: user?.first_name ?? '',
            last_name: user?.last_name ?? '',
          }}
          onSubmit={updateUser}
        />
      </section>
      <section>
        <ThemeSettings />
      </section>
    </article>
  )
})

const GithubProfile = observer(() => {
  const { ui } = useStore()

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
            value={ui.profile?.username ?? ''}
          />
          <Input
            readOnly
            disabled
            label="Email"
            layout="horizontal"
            value={ui.profile?.primary_email ?? ''}
          />
        </div>
      </Panel.Content>
    </Panel>
  )
})

const ThemeSettings = observer(() => {
  const { ui } = useStore()

  return (
    <Panel title={<h5 key="panel-title">Theme</h5>}>
      <Panel.Content>
        <Listbox
          value={ui.themeOption}
          label="Interface theme"
          descriptionText="Choose a theme preference"
          layout="horizontal"
          style={{ width: '50%' }}
          icon={
            ui.themeOption === 'light' ? (
              <IconSun />
            ) : ui.themeOption === 'dark' ? (
              <IconMoon />
            ) : undefined
          }
          onChange={(themeOption: any) => ui.onThemeOptionChange(themeOption)}
        >
          <Listbox.Option label="System default" value="system">
            System default
          </Listbox.Option>
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
