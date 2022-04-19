import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { IconMoon, IconSun, Typography, Input, Listbox, Toggle } from '@supabase/ui'

import { useProfile, useStore, withAuth } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AccountLayout } from 'components/layouts'
import Panel from 'components/to-be-cleaned/Panel'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'

const User = () => {
  return (
    <AccountLayout
      title="Supabase"
      breadcrumbs={[
        {
          key: `supabase-settings`,
          label: 'Preferences',
        },
      ]}
    >
      <div className="my-2">
        <ProfileCard />
      </div>
    </AccountLayout>
  )
}

export default withAuth(User)

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
    <article className="p-4 max-w-4xl">
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
      title={[
        <Typography.Title key="panel-title" level={5} className="mb-0">
          Account Information
        </Typography.Title>,
      ]}
    >
      <Panel.Content>
        <div className="space-y-2">
          <Input
            readOnly
            disabled
            label="Username"
            layout="horizontal"
            className="items-center"
            value={ui.profile?.username ?? ''}
          />
          <Input
            readOnly
            disabled
            label="Email"
            layout="horizontal"
            className="items-center"
            value={ui.profile?.primary_email ?? ''}
          />
        </div>
      </Panel.Content>
    </Panel>
  )
})

const ThemeSettings = observer(() => {
  const { ui } = useStore()

  const [exampleProject, setExampleProject] = useState<string>('show')
  const [clientLibraries, setClientLibraries] = useState<string>('show')

  const toggleExampleProject = () => {
    if (exampleProject === 'show') {
      setExampleProject('hide')
    } else {
      setExampleProject('show')
    }
    localStorage.setItem('supabaseExampleProject', exampleProject)
  }

  const toggleClientLibraries = () => {
    if (clientLibraries === 'show') {
      setClientLibraries('hide')
    } else {
      setClientLibraries('show')
    }
    localStorage.setItem('supabaseClientLibraries', exampleProject)
  }

  return (
    <Panel
      title={[
        <Typography.Title key="panel-title" level={5}>
          Dashboard UI
        </Typography.Title>,
      ]}
    >
      <Panel.Content className="space-y-6">
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
        <div className="text-scale-1100 text-sm flex justify-between items-center" style={{ width: '40%' }}>
          <span>Client Libraries</span>
          <Toggle checked={exampleProject === 'show' ? true : false} onChange={() => toggleClientLibraries()} />
        </div>
        <div className="text-scale-1100 text-sm flex justify-between items-center" style={{ width: '40%' }}>
          <span>Example Projects</span>
          <Toggle checked={exampleProject === 'show' ? true : false} onChange={() => toggleExampleProject()} />
        </div>
      </Panel.Content>
    </Panel>
  )
})
