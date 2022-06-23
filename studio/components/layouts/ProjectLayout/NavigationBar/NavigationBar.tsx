import React, { FC, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { isUndefined } from 'lodash'
import { Button, IconHome, Dropdown, IconUser, IconSettings } from '@supabase/ui'

import { IS_PLATFORM } from 'lib/constants'
import { useStore, useFlag } from 'hooks'
import { generateProductRoutes, generateOtherRoutes } from './NavigationBar.utils'
import NavigationIconButton from './NavigationIconButton'

interface Props {}

const NavigationBar: FC<Props> = ({}) => {
  const router = useRouter()
  const { ui } = useStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const projectRef = ui.selectedProjectRef as string
  const projectBaseInfo = ui.selectedProjectBaseInfo

  const ongoingIncident = useFlag('ongoingIncident')

  const activeRoute = router.pathname.split('/')[3]
  const productRoutes = generateProductRoutes(projectRef, projectBaseInfo)
  const otherRoutes = generateOtherRoutes(projectRef, projectBaseInfo)

  return (
    <div
      style={{ height: ongoingIncident ? 'calc(100vh - 44px)' : '100vh' }}
      className={[
        `${isCollapsed ? 'w-14' : 'w-48'}`,
        'flex flex-col justify-between overflow-y-hidden p-2',
        'bg-sidebar-light dark:bg-sidebar-dark dark:border-dark border-r',
      ].join(' ')}
    >
      <ul className="flex flex-col space-y-2">
        <Link href='/'>
          <a className={`block ml-2 w-fit ${isCollapsed ? "h-6 my-2" : "h-10"}`}>
            {isCollapsed ? (
              <Image src="/img/supabase-logo.svg" width="24" height="24" alt="Supabase Logo" />
            ) : (
              <Image src={`/img/${"supabase-dark.svg"}`} width="125" height="40" alt="Supabase Logo" />
            )}
          </a>
        </Link>
        <NavigationIconButton
          isCollapsed={isCollapsed}
          isActive={isUndefined(activeRoute) && !isUndefined(router.query.ref)}
          route={{
            key: 'HOME',
            label: 'Home',
            icon: <IconHome size={18} strokeWidth={2} />,
            link: `/project/${projectRef}`,
          }}
        />
        <div className="bg-scale-500 h-px w-full"></div>
        {productRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isCollapsed={isCollapsed}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="bg-scale-500 h-px w-full"></div>
        {otherRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isCollapsed={isCollapsed}
            isActive={activeRoute === route.key}
          />
        ))}
      </ul>
      <ul className="flex flex-col space-y-2">
        <Dropdown
          side="right"
          align="start"
          overlay={
            <>
              {IS_PLATFORM && (
                <>
                  <Link href="/account/me">
                    <Dropdown.Item key="header" icon={<IconSettings size={14} strokeWidth={1.5} />}>
                      Account Preferences
                    </Dropdown.Item>
                  </Link>
                  <Dropdown.Seperator />
                </>
              )}
              <Dropdown.Label>Theme</Dropdown.Label>
              <Dropdown.RadioGroup
                key="theme"
                value={ui.themeOption}
                onChange={(e: any) => ui.onThemeOptionChange(e)}
              >
                <Dropdown.Radio value="system">System default</Dropdown.Radio>
                <Dropdown.Radio value="dark">Dark</Dropdown.Radio>
                <Dropdown.Radio value="light">Light</Dropdown.Radio>
              </Dropdown.RadioGroup>
            </>
          }
        >
          <Button as="span" type="text" size="tiny">
            <div className="py-1 flex items-start space-x-2">
              <IconUser size={18} strokeWidth={2} />
              {isCollapsed === false && <span className='text-sm'>Account Preferences</span>}
            </div>
          </Button>
        </Dropdown>
      </ul>
    </div>
  )
}

export default observer(NavigationBar)
