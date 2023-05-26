import Link from 'next/link'
import { FC } from 'react'
import { isUndefined } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import {
  Button,
  Dropdown,
  IconHome,
  IconSettings,
  IconUser,
  IconSearch,
  useCommandMenu,
  IconCommand,
} from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useFlag, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import {
  generateOtherRoutes,
  generateProductRoutes,
  generateToolRoutes,
} from './NavigationBar.utils'
import NavigationIconButton from './NavigationIconButton'
import { useParams } from 'common/hooks'
import { useTheme } from 'common'
import { detectOS } from 'lib/helpers'

interface Props {}

const NavigationBar: FC<Props> = ({}) => {
  const router = useRouter()
  const { ui } = useStore()
  const { isDarkMode, toggleTheme } = useTheme()
  const { ref: projectRef } = useParams()

  const projectBaseInfo = ui.selectedProjectBaseInfo
  const ongoingIncident = useFlag('ongoingIncident')

  const activeRoute = router.pathname.split('/')[3]
  const toolRoutes = generateToolRoutes(projectRef, projectBaseInfo)
  const productRoutes = generateProductRoutes(projectRef, projectBaseInfo)
  const otherRoutes = generateOtherRoutes(projectRef, projectBaseInfo)
  const showCmdkHelper = useFlag('dashboardCmdk')
  const os = detectOS()
  const { setIsOpen } = useCommandMenu()
  return (
    <div
      style={{ height: ongoingIncident ? 'calc(100vh - 44px)' : '100vh' }}
      className={[
        'flex w-14 flex-col justify-between overflow-y-hidden p-2',
        'border-r bg-body border-scale-500',
      ].join(' ')}
    >
      <ul className="flex flex-col space-y-2">
        <Link href="/projects">
          <a className="block">
            <img
              src={`${router.basePath}/img/supabase-logo.svg`}
              alt="Supabase"
              className="mx-auto h-[40px] w-6 cursor-pointer rounded"
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
        <div className="bg-scale-500 h-px w-full"></div>
        {toolRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="bg-scale-500 h-px w-full"></div>

        {productRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
        <div className="h-px w-full bg-scale-500"></div>
        {otherRoutes.map((route) => (
          <NavigationIconButton
            key={route.key}
            route={route}
            isActive={activeRoute === route.key}
          />
        ))}
      </ul>
      <ul className="flex flex-col space-y-4 items-center">
        {IS_PLATFORM && showCmdkHelper && (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Button as="span" type="text" size="tiny" onClick={() => setIsOpen(true)}>
                <div className="py-1">
                  <IconSearch size={18} strokeWidth={2} />
                </div>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="right">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded  py-1 px-2 leading-none shadow',
                    'border border-scale-200 flex items-center space-x-1',
                  ].join(' ')}
                >
                  {os === 'macos' ? (
                    <IconCommand size={11.5} strokeWidth={1.5} className="text-scale-1200" />
                  ) : (
                    <p className="text-xs">CTRL</p>
                  )}
                  <p className="text-xs">K</p>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
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
                  <Dropdown.Separator />
                </>
              )}
              <Dropdown.Label>Theme</Dropdown.Label>
              <Dropdown.RadioGroup
                key="theme"
                value={isDarkMode ? 'dark' : 'light'}
                onChange={(e: any) => toggleTheme(e === 'dark')}
              >
                {/* [Joshen] Removing system default for now, needs to be supported in useTheme from common packages */}
                {/* <Dropdown.Radio value="system">System default</Dropdown.Radio> */}
                <Dropdown.Radio value="dark">Dark</Dropdown.Radio>
                <Dropdown.Radio value="light">Light</Dropdown.Radio>
              </Dropdown.RadioGroup>
            </>
          }
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
