import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { IconMoon, IconSun, Select, Typography } from '@supabase/ui'

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

function ThemeSettings() {
  const [value, setValue] = useState('')
  const { ui } = useStore()

  useEffect(() => {
    const localStorageThemeOption = window.localStorage.getItem('theme')
    if (localStorageThemeOption) return setValue(localStorageThemeOption)
    window.localStorage.setItem('theme', 'dark')
    setValue('dark')
  }, [])

  const onThemeOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const themeOption = e.target.value as 'dark' | 'light' | 'system'
    setValue(themeOption)
    if (themeOption === 'system') {
      window.localStorage.setItem('theme', 'system')
      return ui.setTheme(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      )
    }
    window.localStorage.setItem('theme', themeOption)
    ui.setTheme(themeOption)
  }

  return (
    <Panel
      title={[
        <Typography.Title key="panel-title" level={5}>
          Theme
        </Typography.Title>,
      ]}
    >
      <Panel.Content>
        <Select
          value={value}
          label="Interface theme"
          descriptionText="Choose a theme preference"
          layout="horizontal"
          style={{ width: '50%' }}
          icon={value === 'light' ? <IconSun /> : value === 'dark' ? <IconMoon /> : undefined}
          onChange={onThemeOptionChange}
        >
          <Select.Option value="system">System default</Select.Option>
          <Select.Option value="dark">Dark</Select.Option>
          <Select.Option value="light">Light</Select.Option>
        </Select>
      </Panel.Content>
    </Panel>
  )
}
