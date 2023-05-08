import { useRouter } from 'next/router'
import { memo, useEffect } from 'react'
import { menuState, useMenuLevelId } from '~/hooks/useMenuState'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'
import NavigationMenuHome from './HomeMenu'
import { Json } from '~/types'
import { ICommonBase } from '~/components/reference/Reference.types'

// Import dynamically to code split / reduce app bundle size
const specImports = {
  specJsV1: async () => (await import('~/../../spec/supabase_js_v1.yml')).default,
  specJsV2: async () => (await import('~/../../spec/supabase_js_v2.yml')).default,
  specDartV0: async () => (await import('~/../../spec/supabase_dart_v0.yml')).default,
  specDartV1: async () => (await import('~/../../spec/supabase_dart_v1.yml')).default,
  specPythonV2: async () => (await import('~/../../spec/supabase_py_v2.yml')).default,
  specCSharpV0: async () => (await import('~/../../spec/supabase_csharp_v0.yml')).default,
  specSwiftV0: async () => (await import('~/../../spec/supabase_swift_v0.yml')).default,
}

const commonSectionImports = {
  apiCommonSections: async () => (await import('~/../../spec/common-api-sections.json')).default,
  cliCommonSections: async () => (await import('~/../../spec/common-cli-sections.json')).default,
  libCommonSections: async () =>
    (await import('~/../../spec/common-client-libs-sections.json')).default,
  analyticsServerCommonSections: async () =>
    (await import('~/../../spec/common-self-hosting-analytics-sections.json')).default,
  authServerCommonSections: async () =>
    (await import('~/../../spec/common-self-hosting-auth-sections.json')).default,
  functionsServerCommonSections: async () =>
    (await import('~/../../spec/common-self-hosting-functions-sections.json')).default,
  realtimeServerCommonSections: async () =>
    (await import('~/../../spec/common-self-hosting-realtime-sections.json')).default,
  storageServerCommonSections: async () =>
    (await import('~/../../spec/common-self-hosting-storage-sections.json')).default,
}

interface BaseMenu {
  id: string
  path: string
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
  commonSectionImport: () => Promise<ICommonBase[]>
  specImport?: () => Promise<Json>
}

type Menu = HomeMenu | GuideMenu | ReferenceMenu

const menus: Menu[] = [
  {
    id: 'home',
    path: '/',
    type: 'home',
  },
  {
    id: 'gettingstarted',
    path: '/guides/getting-started',
    type: 'guide',
  },
  {
    id: 'database',
    path: '/guides/database',
    type: 'guide',
  },
  {
    id: 'api',
    path: '/guides/api',
    type: 'guide',
  },
  {
    id: 'auth',
    path: '/guides/auth',
    type: 'guide',
  },
  {
    id: 'functions',
    path: '/guides/functions',
    type: 'guide',
  },
  {
    id: 'realtime',
    path: '/guides/realtime',
    type: 'guide',
  },
  {
    id: 'storage',
    path: '/guides/storage',
    type: 'guide',
  },
  {
    id: 'platform',
    path: '/guides/platform',
    type: 'guide',
  },
  {
    id: 'resources',
    path: '/guides/resources',
    type: 'guide',
  },
  {
    id: 'self_hosting',
    path: '/guides/self-hosting',
    type: 'guide',
  },
  {
    id: 'integrations',
    path: '/guides/integrations',
    type: 'guide',
  },
  {
    id: 'supabase_cli',
    // TODO: Add path '/reference/cli/config'
    path: '/guides/cli',
    type: 'guide',
  },
  {
    id: 'reference_javascript_v1',
    path: '/reference/javascript/v1',
    commonSectionImport: commonSectionImports.libCommonSections,
    specImport: specImports.specJsV1,
    type: 'reference',
  },
  {
    id: 'reference_javascript_v2',
    path: '/reference/javascript',
    commonSectionImport: commonSectionImports.libCommonSections,
    specImport: specImports.specJsV2,
    type: 'reference',
  },
  {
    id: 'reference_dart_v0',
    path: '/reference/dart/v0',
    commonSectionImport: commonSectionImports.libCommonSections,
    specImport: specImports.specDartV0,
    type: 'reference',
  },
  {
    id: 'reference_dart_v1',
    path: '/reference/dart',
    commonSectionImport: commonSectionImports.libCommonSections,
    specImport: specImports.specDartV1,
    type: 'reference',
  },
  {
    id: 'reference_csharp_v0',
    path: '/reference/csharp',
    commonSectionImport: commonSectionImports.libCommonSections,
    specImport: specImports.specCSharpV0,
    type: 'reference',
  },
  {
    id: 'reference_python_v2',
    path: '/reference/python',
    commonSectionImport: commonSectionImports.libCommonSections,
    specImport: specImports.specPythonV2,
    type: 'reference',
  },
  {
    id: 'reference_swift_v0',
    path: '/reference/swift',
    commonSectionImport: commonSectionImports.libCommonSections,
    specImport: specImports.specSwiftV0,
    type: 'reference',
  },
  {
    id: 'reference_cli',
    path: '/reference/cli',
    commonSectionImport: commonSectionImports.cliCommonSections,
    type: 'reference',
  },
  {
    id: 'reference_api',
    path: '/reference/api',
    commonSectionImport: commonSectionImports.apiCommonSections,
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_auth',
    path: '/reference/self-hosting-auth',
    commonSectionImport: commonSectionImports.authServerCommonSections,
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_storage',
    path: '/reference/self-hosting-storage',
    commonSectionImport: commonSectionImports.storageServerCommonSections,
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_realtime',
    path: '/reference/self-hosting-realtime',
    commonSectionImport: commonSectionImports.realtimeServerCommonSections,
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_analytics',
    path: '/reference/self-hosting-analytics',
    commonSectionImport: commonSectionImports.analyticsServerCommonSections,
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_functions',
    path: '/reference/self-hosting-functions',
    commonSectionImport: commonSectionImports.functionsServerCommonSections,
    type: 'reference',
  },
]

function getMenuById(id: string) {
  return menus.find((menu) => menu.id === id)
}

function getMenuByUrl(basePath: string, url: string) {
  // If multiple matches, choose the menu with the longest path
  const [menu] = menus
    .filter(({ path }) => url.startsWith(`${basePath}${path}`))
    .sort((a, b) => b.path.length - a.path.length)

  return menu
}

function getMenuElement(menu: Menu) {
  const menuType = menu.type
  switch (menuType) {
    case 'home':
      return <NavigationMenuHome active />
    case 'guide':
      return <NavigationMenuGuideList id={menu.id} active />
    case 'reference':
      return (
        <NavigationMenuRefList
          id={menu.id}
          basePath={menu.path}
          commonSectionsImport={menu.commonSectionImport}
          specImport={menu.specImport}
        />
      )
    default:
      throw new Error(`Unknown menu type '${menuType}'`)
  }
}

const NavigationMenu = () => {
  const router = useRouter()

  function handleRouteChange(url: string) {
    const menu = getMenuByUrl(router.basePath, url)
    if (menu) {
      menuState.setMenuLevelId(menu.id)
    }
  }

  useEffect(() => {
    handleRouteChange(router.basePath + router.asPath)
    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  const level = useMenuLevelId()
  const menu = getMenuById(level)

  return getMenuElement(menu)
}

export default memo(NavigationMenu)
