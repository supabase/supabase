import { memo } from 'react'

import type { NavMenuSection } from '../Navigation.types'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'
import { useCloseMenuOnRouteChange } from './NavigationMenu.utils'

enum MenuId {
  GettingStarted = 'gettingstarted',
  Database = 'database',
  Api = 'api',
  Graphql = 'graphql',
  Auth = 'auth',
  Functions = 'functions',
  Realtime = 'realtime',
  Storage = 'storage',
  Ai = 'ai',
  Platform = 'platform',
  Deployment = 'deployment',
  MonitoringTroubleshooting = 'monitoring_troubleshooting',
  Resources = 'resources',
  SelfHosting = 'self_hosting',
  Integrations = 'integrations',
  LocalDevelopment = 'local_development',
  RefJavaScriptV1 = 'reference_javascript_v1',
  RefJavaScriptV2 = 'reference_javascript_v2',
  RefDartV1 = 'reference_dart_v1',
  RefDartV2 = 'reference_dart_v2',
  RefCSharpV0 = 'reference_csharp_v0',
  RefCSharpV1 = 'reference_csharp_v1',
  RefPythonV2 = 'reference_python_v2',
  RefSwiftV1 = 'reference_swift_v1',
  RefSwiftV2 = 'reference_swift_v2',
  RefKotlinV1 = 'reference_kotlin_v1',
  RefKotlinV2 = 'reference_kotlin_v2',
  RefKotlinV3 = 'reference_kotlin_v3',
  RefCli = 'reference_cli',
  RefApi = 'reference_api',
  SelfHostingAuth = 'reference_self_hosting_auth',
  SelfHostingStorage = 'reference_self_hosting_storage',
  SelfHostingRealtime = 'reference_self_hosting_realtime',
  SelfHostingAnalytics = 'reference_self_hosting_analytics',
  SelfHostingFunctions = 'reference_self_hosting_functions',
}

interface BaseMenu {
  id: MenuId
  type: string
}

interface GuideMenu extends BaseMenu {
  type: 'guide'
}

interface ReferenceMenu extends BaseMenu {
  type: 'reference'
  path: string
  commonSectionsFile?: string
}

type Menu = GuideMenu | ReferenceMenu

const menus: Menu[] = [
  {
    id: MenuId.GettingStarted,
    type: 'guide',
  },
  {
    id: MenuId.Database,
    type: 'guide',
  },
  {
    id: MenuId.Api,
    type: 'guide',
  },
  {
    id: MenuId.Graphql,
    type: 'guide',
  },
  {
    id: MenuId.Auth,
    type: 'guide',
  },
  {
    id: MenuId.Functions,
    type: 'guide',
  },
  {
    id: MenuId.MonitoringTroubleshooting,
    type: 'guide',
  },
  {
    id: MenuId.Realtime,
    type: 'guide',
  },
  {
    id: MenuId.Storage,
    type: 'guide',
  },
  {
    id: MenuId.Ai,
    type: 'guide',
  },
  {
    id: MenuId.Platform,
    type: 'guide',
  },
  {
    id: MenuId.Resources,
    type: 'guide',
  },
  {
    id: MenuId.SelfHosting,
    type: 'guide',
  },
  {
    id: MenuId.Integrations,
    type: 'guide',
  },
  {
    id: MenuId.LocalDevelopment,
    type: 'guide',
  },
  {
    id: MenuId.Deployment,
    type: 'guide',
  },
  {
    id: MenuId.RefJavaScriptV1,
    type: 'reference',
    path: '/reference/javascript/v1',
  },
  {
    id: MenuId.RefJavaScriptV2,
    type: 'reference',
    path: '/reference/javascript',
  },
  {
    id: MenuId.RefDartV1,
    type: 'reference',
    path: '/reference/dart/v1',
  },
  {
    id: MenuId.RefDartV2,
    type: 'reference',
    path: '/reference/dart',
  },
  {
    id: MenuId.RefCSharpV0,
    type: 'reference',
    path: '/reference/csharp/v0',
  },
  {
    id: MenuId.RefCSharpV1,
    type: 'reference',
    path: '/reference/csharp',
  },
  {
    id: MenuId.RefPythonV2,
    type: 'reference',
    path: '/reference/python',
  },
  {
    id: MenuId.RefSwiftV1,
    type: 'reference',
    path: '/reference/swift',
  },
  {
    id: MenuId.RefSwiftV2,
    type: 'reference',
    path: '/reference/swift',
  },
  {
    id: MenuId.RefKotlinV1,
    type: 'reference',
    path: '/reference/kotlin/v1',
  },
  {
    id: MenuId.RefKotlinV2,
    type: 'reference',
    path: '/reference/kotlin/v2',
  },
  {
    id: MenuId.RefKotlinV3,
    type: 'reference',
    path: '/reference/kotlin',
  },
  {
    id: MenuId.RefCli,
    type: 'reference',
    path: '/reference/cli',
    commonSectionsFile: 'common-cli-sections.json',
  },
  {
    id: MenuId.RefApi,
    type: 'reference',
    path: '/reference/api',
    commonSectionsFile: 'common-api-sections.json',
  },
  {
    id: MenuId.SelfHostingAuth,
    type: 'reference',
    path: '/reference/self-hosting-auth',
    commonSectionsFile: 'common-self-hosting-auth-sections.json',
  },
  {
    id: MenuId.SelfHostingStorage,
    type: 'reference',
    path: '/reference/self-hosting-storage',
    commonSectionsFile: 'common-self-hosting-storage-sections.json',
  },
  {
    id: MenuId.SelfHostingRealtime,
    type: 'reference',
    path: '/reference/self-hosting-realtime',
    commonSectionsFile: 'common-self-hosting-realtime-sections.json',
  },
  {
    id: MenuId.SelfHostingAnalytics,
    type: 'reference',
    path: '/reference/self-hosting-analytics',
    commonSectionsFile: 'common-self-hosting-analytics-sections.json',
  },
  {
    id: MenuId.SelfHostingFunctions,
    type: 'reference',
    path: '/reference/self-hosting-functions',
    commonSectionsFile: 'common-self-hosting-functions-sections.json',
  },
]

function getMenuById(id: MenuId) {
  return menus.find((menu) => menu.id === id)
}

function getMenuElement(menu: Menu | undefined, props?: any) {
  const menuType = menu?.type
  switch (menuType) {
    case 'guide':
      return <NavigationMenuGuideList id={menu.id} {...props} />
    case 'reference':
      return (
        <NavigationMenuRefList
          id={menu.id}
          basePath={menu.path}
          commonSectionsFile={menu.commonSectionsFile}
        />
      )
    default:
      return null
  }
}

const NavigationMenu = ({
  menuId,
  additionalNavItems,
}: {
  menuId: MenuId
  additionalNavItems?: Record<string, Partial<NavMenuSection>[]>
}) => {
  const level = menuId
  const menu = getMenuById(level)

  useCloseMenuOnRouteChange()

  return getMenuElement(menu, { additionalNavItems })
}

export { MenuId, getMenuById }
export default memo(NavigationMenu)
