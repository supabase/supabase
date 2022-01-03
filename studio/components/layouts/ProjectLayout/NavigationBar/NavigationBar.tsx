import React, { FC, useEffect, useState } from 'react'
import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { isUndefined } from 'lodash'
import { Button, Divider, IconHome, Dropdown, IconUser, Select, Typography } from '@supabase/ui'

import { IS_PLATFORM } from 'lib/constants'
import { useStore } from 'hooks'
import { generateProductRoutes, generateOtherRoutes } from './NavigationBar.utils'
import NavigationIconButton from './NavigationIconButton'

interface Props {}

const NavigationBar: FC<Props> = ({}) => {
  const router = useRouter()
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref as string

  const activeRoute = router.pathname.split('/')[3]
  const productRoutes = generateProductRoutes(projectRef)
  const otherRoutes = generateOtherRoutes(projectRef)

  const [value, setValue] = useState('')

  useEffect(() => {
    const localStorageThemeOption = window.localStorage.getItem('theme') as string
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
    <div className="h-screen w-14 flex flex-col justify-between p-2 overflow-y-hidden bg-sidebar-light dark:bg-sidebar-dark border-r dark:border-dark">
      <ul className="flex flex-col space-y-2">
        <Link href={'/'}>
          <a className="block">
            <img
              src="/img/supabase-logo.svg"
              alt="Supabase"
              className="rounded h-[40px] w-6 mx-auto cursor-pointer"
            />
          </a>
        </Link>
        <NavigationIconButton
          isActive={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
          route={{
            key: 'HOME',
            label: 'Home',
            icon: <IconHome size={18} strokeWidth={2} />,
            link: `/project/${projectRef}`,
          }}
        />
        <Divider light />
        {productRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <Divider light />
        {otherRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
      </ul>
      <ul className="flex flex-col space-y-2">
        <Dropdown
          side="right"
          align="start"
          overlay={[
            ...(IS_PLATFORM
              ? [
                  <Dropdown.Item key="header">
                    <Link href="/account/me">
                      <a className="block">
                        <Typography.Text>Account Preferences</Typography.Text>
                      </a>
                    </Link>
                  </Dropdown.Item>,
                ]
              : []),
            <Divider key="d1" light />,
            <Dropdown.Misc key="theme">
              <div className="w-[240px] py-1 flex items-center justify-between">
                <Typography.Text>Theme</Typography.Text>
                <Select value={value} onChange={onThemeOptionChange}>
                  <Select.Option value="system">System default</Select.Option>
                  <Select.Option value="dark">Dark</Select.Option>
                  <Select.Option value="light">Light</Select.Option>
                </Select>
              </div>
            </Dropdown.Misc>,
          ]}
        >
          <Button as="span" type="text" size="tiny">
            <div className="py-1">
              <IconUser size={18} strokeWidth={2} />
            </div>
          </Button>
        </Dropdown>
      </ul>
    </div>
  )
}

export default observer(NavigationBar)
