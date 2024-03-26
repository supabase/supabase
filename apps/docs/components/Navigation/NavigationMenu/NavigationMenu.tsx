import { memo } from 'react'
import NavigationMenuHome from './HomeMenu'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'

enum MenuId {
  Home = 'home',
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
  Resources = 'resources',
  SelfHosting = 'self_hosting',
  Integrations = 'integrations',
  Cli = 'supabase_cli',
  RefJavaScriptV1 = 'reference_javascript_v1',
  RefJavaScriptV2 = 'reference_javascript_v2',
  RefDartV1 = 'reference_dart_v1',
  RefDartV2 = 'reference_dart_v2',
  RefCSharpV0 = 'reference_csharp_v0',
  RefPythonV2 = 'reference_python_v2',
  RefSwiftV1 = 'reference_swift_v1',
  RefSwiftV2 = 'reference_swift_v2',
  RefKotlinV1 = 'reference_kotlin_v1',
  RefKotlinV2 = 'reference_kotlin_v2',
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

interface HomeMenu extends BaseMenu {
  type: 'home'
}

interface GuideMenu extends BaseMenu {
  type: 'guide'
}

interface ReferenceMenu extends BaseMenu {
  type: 'reference'
  path: string
  commonSectionsFile: string
  specFile?: string
}

type Menu = HomeMenu | GuideMenu | ReferenceMenu

const menus: Menu[] = [
  {
    id: MenuId.Home,
    type: 'home',
  },
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
    id: MenuId.Cli,
    type: 'guide',
  },
  {
    id: MenuId.RefJavaScriptV1,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_js_v1.yml',
    type: 'reference',
    path: '/reference/javascript/v1',
  },
  {
    id: MenuId.RefJavaScriptV2,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_js_v2.yml',
    type: 'reference',
    path: '/reference/javascript',
  },
  {
    id: MenuId.RefDartV1,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_dart_v1.yml',
    type: 'reference',
    path: '/reference/dart/v1',
  },
  {
    id: MenuId.RefDartV2,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_dart_v2.yml',
    type: 'reference',
    path: '/reference/dart',
  },
  {
    id: MenuId.RefCSharpV0,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_csharp_v0.yml',
    type: 'reference',
    path: '/reference/csharp',
  },
  {
    id: MenuId.RefPythonV2,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_py_v2.yml',
    type: 'reference',
    path: '/reference/python',
  },
  {
    id: MenuId.RefSwiftV1,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_swift_v1.yml',
    type: 'reference',
    path: '/reference/swift',
  },
  {
    id: MenuId.RefSwiftV2,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_swift_v2.yml',
    type: 'reference',
    path: '/reference/swift',
  },
  {
    id: MenuId.RefKotlinV1,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_kt_v1.yml',
    type: 'reference',
    path: '/reference/kotlin/v1',
  },
  {
    id: MenuId.RefKotlinV2,
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_kt_v2.yml',
    type: 'reference',
    path: '/reference/kotlin',
  },
  {
    id: MenuId.RefCli,
    commonSectionsFile: 'common-cli-sections.json',
    type: 'reference',
    path: '/reference/cli',
  },
  {
    id: MenuId.RefApi,
    commonSectionsFile: 'common-api-sections.json',
    type: 'reference',
    path: '/reference/api',
  },
  {
    id: MenuId.SelfHostingAuth,
    commonSectionsFile: 'common-self-hosting-auth-sections.json',
    type: 'reference',
    path: '/reference/self-hosting-auth',
  },
  {
    id: MenuId.SelfHostingStorage,
    commonSectionsFile: 'common-self-hosting-storage-sections.json',
    type: 'reference',
    path: '/reference/self-hosting-storage',
  },
  {
    id: MenuId.SelfHostingRealtime,
    commonSectionsFile: 'common-self-hosting-realtime-sections.json',
    type: 'reference',
    path: '/reference/self-hosting-realtime',
  },
  {
    id: MenuId.SelfHostingAnalytics,
    commonSectionsFile: 'common-self-hosting-analytics-sections.json',
    type: 'reference',
    path: '/reference/self-hosting-analytics',
  },
  {
    id: MenuId.SelfHostingFunctions,
    commonSectionsFile: 'common-self-hosting-functions-sections.json',
    type: 'reference',
    path: '/reference/self-hosting-functions',
  },
]

function getMenuById(id: MenuId) {
  return menus.find((menu) => menu.id === id) ?? menus.find((menu) => menu.id === MenuId.Home)
}

function getMenuElement(menu: Menu) {
  const menuType = menu.type
  switch (menuType) {
    case 'home':
      return <NavigationMenuHome />
    case 'guide':
      return <NavigationMenuGuideList id={menu.id} />
    case 'reference':
      return (
        <NavigationMenuRefList
          id={menu.id}
          basePath={menu.path}
          commonSectionsFile={menu.commonSectionsFile}
          specFile={menu.specFile}
        />
      )
    default:
      throw new Error(`Unknown menu type '${menuType}'`)
  }
}

const NavigationMenu = ({ menuId }: { menuId: MenuId }) => {
  const level = menuId
  const menu = getMenuById(level)

  return getMenuElement(menu)
}

export { MenuId }
export default memo(NavigationMenu)
