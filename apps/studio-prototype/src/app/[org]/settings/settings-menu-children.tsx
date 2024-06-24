import React from 'react'

import settingsData from '@/src/config/settings.json'
import { ScrollArea, ScrollBar } from 'ui'
import { useConfig } from '@/src/hooks/use-config'

const SettingsMenuChildren: React.FC = () => {
  const [config] = useConfig()

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
    return items.map((item) => (
      <li key={item.key} className="py-0.5">
        <a href={`${basePath}${item.href}`} className="hover:text-white text-sm">
          {item.label}
        </a>
        {item.items && (
          <ul role="menu" className="pl-4">
            {renderItems(item.items, basePath)}
          </ul>
        )}
      </li>
    ))
  }

  return (
    <ScrollArea className="h-full w-full overflow-hidden">
      <nav aria-label="Settings Navigation" className="text-foreground-light h-full">
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Project Settings</h2>
          <ul role="menu" className="mt-2 pl-2 border-l border-gray-700">
            {renderItems(settingsData.PROJECT_SETTINGS.items, getBasePath('PROJECT_SETTINGS'))}
          </ul>
        </div>
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Organization Settings</h2>
          <ul role="menu" className="mt-2 pl-2 border-l border-gray-700">
            {renderItems(
              settingsData.ORGANIZATION_SETTINGS.items,
              getBasePath('ORGANIZATION_SETTINGS')
            )}
          </ul>
        </div>
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Account Settings</h2>
          <ul role="menu" className="mt-2 pl-2 border-l border-gray-700">
            {renderItems(settingsData.ACCOUNT_SETTINGS.items, getBasePath('ACCOUNT_SETTINGS'))}
          </ul>
        </div>
      </nav>
      <ScrollBar />
    </ScrollArea>
  )
}

export default SettingsMenuChildren
