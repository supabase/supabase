import React from 'react'
import { usePathname } from 'next/navigation'
import settingsData from '@/src/config/settings.json'
import { ScrollArea, ScrollBar, cn } from 'ui'
import { useConfig } from '@/src/hooks/use-config'

const SettingsMenuChildren: React.FC = () => {
  const [config] = useConfig()
  const pathname = usePathname()

  const { organization, project } = config

  const getBasePath = (section: string) => {
    switch (section) {
      case 'PROJECT_SETTINGS':
        return `/${organization}/settings/${project}`
      case 'ORGANIZATION_SETTINGS':
        return `/${organization}/settings`
      case 'ACCOUNT_SETTINGS':
        return `/${organization}/settings/account`
      default:
        return ''
    }
  }

  const renderItems = (items: any[], basePath: string) => {
    return items.map((item) => {
      const fullPath = `${basePath}${item.href}`
      const isActive = pathname.startsWith(fullPath)

      return (
        <li key={item.key}>
          <a
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
          </a>
          {item.items && (
            <ul role="menu" className="pl-5">
              {renderItems(item.items, basePath)}
            </ul>
          )}
        </li>
      )
    })
  }

  const renderGroup = (group: string) => {
    return (
      <h2 className="text-sm font-mono text-foreground-muted uppercase tracking-wide px-5">
        {group}
      </h2>
    )
  }

  return (
    <ScrollArea className="h-full w-full overflow-hidden">
      <nav aria-label="Settings Navigation" className="text-foreground-light h-full py-3">
        <div className="mb-8">
          {renderGroup('Project Settings')}
          <ul role="menu" className="mt-2">
            {renderItems(settingsData.PROJECT_SETTINGS.items, getBasePath('PROJECT_SETTINGS'))}
          </ul>
        </div>
        <div className="mb-8">
          {renderGroup('Organization Settings')}
          <ul role="menu" className="mt-2">
            {renderItems(
              settingsData.ORGANIZATION_SETTINGS.items,
              getBasePath('ORGANIZATION_SETTINGS')
            )}
          </ul>
        </div>
        <div className="mb-8">
          {renderGroup('Account Settings')}
          <ul role="menu" className="mt-2">
            {renderItems(settingsData.ACCOUNT_SETTINGS.items, getBasePath('ACCOUNT_SETTINGS'))}
          </ul>
        </div>
      </nav>
      <ScrollBar />
    </ScrollArea>
  )
}

export default SettingsMenuChildren
