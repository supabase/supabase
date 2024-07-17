'use client'

import settingsData from '@/src/config/settings.json'
import { useConfig } from '@/src/hooks/use-config'
import { usePathname } from 'next/navigation'
import { ScrollArea, ScrollBar } from 'ui'
import { ClickCounter } from './click-counter'
import { SettingsGroup } from './settings-menu-group'

// Define types for the settings data items

export interface SettingsItemProps {
  item: {
    key: string
    label: string
    href: string
    items?: SettingsItemProps['item'][]
  }
  basePath: string
}
export interface SettingsGroupProps {
  group: 'Project settings' | 'Environment settings' | 'Organization settings' | 'Account settings'
  items: SettingsItemProps['item'][]
  basePath: string
  hasBranchingEnabled?: boolean
}

const SettingsMenuChildren = () => {
  const [config] = useConfig()
  const pathname = usePathname()
  const { selectedOrg, selectedProject } = config

  const getBasePath = (section: string): string => {
    switch (section) {
      case 'PROJECT_SETTINGS':
        return `/${selectedOrg?.key}/${selectedProject?.key}/settings/project`
      case 'ENV_SETTINGS':
        return `/${selectedOrg?.key}/${selectedProject?.key}/settings/project`
      case 'ORGANIZATION_SETTINGS':
        return `/${selectedOrg?.key}/settings`
      case 'ACCOUNT_SETTINGS':
        return `/${selectedOrg?.key}/settings/account`
      default:
        return ''
    }
  }

  const hasBranchingEnabled = selectedProject?.branching

  return (
    <ScrollArea className="h-full w-full overflow-hidden">
      {/* <ClickCounter /> */}
      <nav aria-label="Settings Navigation" className="text-foreground-light h-full py-3">
        <SettingsGroup
          key={'project-settings'}
          group="Project settings"
          items={settingsData.PROJECT_SETTINGS.items}
          basePath={getBasePath('PROJECT_SETTINGS')}
          hasBranchingEnabled={hasBranchingEnabled}
        />
        <SettingsGroup
          key={'environment-settings'}
          group="Environment settings"
          items={settingsData.ENV_SETTINGS.items}
          basePath={getBasePath('PROJECT_SETTINGS')}
          hasBranchingEnabled={hasBranchingEnabled}
        />
        {/* <SettingsGroup
          key={'organization-settings'}
          group="Organization settings"
          items={settingsData.ORGANIZATION_SETTINGS.items}
          basePath={getBasePath('ORGANIZATION_SETTINGS')}
        />
        <SettingsGroup
          key={'account-settings'}
          group="Account settings"
          items={settingsData.ACCOUNT_SETTINGS.items}
          basePath={getBasePath('ACCOUNT_SETTINGS')}
        /> */}
      </nav>
      <ScrollBar />
    </ScrollArea>
  )
}

export default SettingsMenuChildren
