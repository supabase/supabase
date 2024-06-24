'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import settingsData from '@/src/config/settings.json'
import { ScrollArea, ScrollBar, cn } from 'ui'
import { useConfig } from '@/src/hooks/use-config'
import { ClickCounter } from './click-counter'
import Link from 'next/link'

// Define types for the settings data items
interface SettingsItemProps {
  item: {
    key: string
    label: string
    href: string
    items?: SettingsItemProps['item'][]
  }
  basePath: string
}

interface SettingsGroupProps {
  group: string
  items: SettingsItemProps['item'][]
  basePath: string
}

const SettingsMenuChildren = () => {
  const [config] = useConfig()
  const pathname = usePathname()
  const { organization, project } = config

  const getBasePath = (section: string): string => {
    switch (section) {
      case 'PROJECT_SETTINGS':
        return `/${organization}/settings/project/${project}`
      case 'ORGANIZATION_SETTINGS':
        return `/${organization}/settings`
      case 'ACCOUNT_SETTINGS':
        return `/${organization}/settings/account`
      default:
        return ''
    }
  }

  const SettingsItem = React.memo(
    ({ item, basePath }: SettingsItemProps) => {
      const fullPath = `${basePath}${item.href}`
      const isActive = pathname.startsWith(fullPath)

      return (
        <li key={item.key}>
          {/* <ClickCounter /> */}
          <Link
            href={fullPath}
            className={`pl-5 group/nav-item-anchor relative hover:text-foreground text-sm ${isActive ? 'text-foreground' : 'text-foreground-lighter'}`}
          >
            {item.label}
            <div
              className={cn(
                'absolute top-1/2 transform -translate-y-1/2 h-2 w-[3px] rounded-r-full duration-500',
                'group-hover/nav-item-anchor:bg-foreground-muted group-hover/nav-item-anchor:left-0',
                isActive ? '!bg-foreground left-0 w-[5px] duration-100' : '-left-1',
                'transition-all'
              )}
            ></div>
          </Link>
          {item.items && (
            <ul role="menu" className="pl-5">
              {item.items.map((childItem) => (
                <SettingsItem key={childItem.key} item={childItem} basePath={basePath} />
              ))}
            </ul>
          )}
        </li>
      )
    },
    (prevProps, nextProps) => {
      return prevProps.item === nextProps.item && prevProps.basePath === nextProps.basePath
    }
  )

  SettingsItem.displayName = 'SettingsItem'

  const SettingsGroup = React.memo(
    ({ group, items, basePath }: SettingsGroupProps) => (
      <div className="mb-8">
        {/* <ClickCounter /> */}
        <h2 className="text-sm font-mono text-foreground-lighter/75 uppercase tracking-wide px-5">
          {group}
        </h2>
        <ul role="menu" className="mt-2">
          {items.map((item) => (
            <SettingsItem key={item.key} item={item} basePath={basePath} />
          ))}
        </ul>
      </div>
    ),
    (prevProps, nextProps) => {
      return (
        prevProps.group === nextProps.group &&
        prevProps.items === nextProps.items &&
        prevProps.basePath === nextProps.basePath
      )
    }
  )

  SettingsGroup.displayName = 'SettingsGroup'

  return (
    <ScrollArea className="h-full w-full overflow-hidden">
      {/* <ClickCounter /> */}
      <nav aria-label="Settings Navigation" className="text-foreground-light h-full py-3">
        <SettingsGroup
          group="Project Settings"
          items={settingsData.PROJECT_SETTINGS.items}
          basePath={getBasePath('PROJECT_SETTINGS')}
        />
        <SettingsGroup
          group="Organization Settings"
          items={settingsData.ORGANIZATION_SETTINGS.items}
          basePath={getBasePath('ORGANIZATION_SETTINGS')}
        />
        <SettingsGroup
          group="Account Settings"
          items={settingsData.ACCOUNT_SETTINGS.items}
          basePath={getBasePath('ACCOUNT_SETTINGS')}
        />
      </nav>
      <ScrollBar />
    </ScrollArea>
  )
}

export default SettingsMenuChildren
