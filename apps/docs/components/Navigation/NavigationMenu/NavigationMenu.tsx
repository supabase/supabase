import { useRouter } from 'next/router'
import { memo, useEffect } from 'react'
import { menuState, useMenuLevelId } from '~/hooks/useMenuState'
import NavigationMenuHome from './HomeMenu'
import NavigationMenuGuideList from './NavigationMenuGuideList'
import NavigationMenuRefList from './NavigationMenuRefList'

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
  commonSectionsFile: string
  specFile?: string
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
    id: 'graphql',
    path: '/guides/graphql',
    type: 'guide',
  },
  {
    id: 'auth',
    path: '/guides/auth',
    type: 'guide',
  },
  {
    id: 'auth',
    path: '/learn/auth-deep-dive',
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
    id: 'ai',
    path: '/guides/ai',
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
    // TODO: Add path '/guides/cli/config'
    path: '/guides/cli',
    type: 'guide',
  },
  {
    id: 'reference_javascript_v1',
    path: '/reference/javascript/v1',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_js_v1.yml',
    type: 'reference',
  },
  {
    id: 'reference_javascript_v2',
    path: '/reference/javascript',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_js_v2.yml',
    type: 'reference',
  },
  {
    id: 'reference_dart_v0',
    path: '/reference/dart/v0',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_dart_v0.yml',
    type: 'reference',
  },
  {
    id: 'reference_dart_v1',
    path: '/reference/dart',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_dart_v1.yml',
    type: 'reference',
  },
  {
    id: 'reference_csharp_v0',
    path: '/reference/csharp',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_csharp_v0.yml',
    type: 'reference',
  },
  {
    id: 'reference_python_v2',
    path: '/reference/python',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_py_v2.yml',
    type: 'reference',
  },
  {
    id: 'reference_swift_v1',
    path: '/reference/swift',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_swift_v1.yml',
    type: 'reference',
  },
  {
    id: 'reference_kotlin_v0',
    path: '/reference/kotlin',
    commonSectionsFile: 'common-client-libs-sections.json',
    specFile: 'supabase_kt_v1.yml',
    type: 'reference',
  },
  {
    id: 'reference_cli',
    path: '/reference/cli',
    commonSectionsFile: 'common-cli-sections.json',
    type: 'reference',
  },
  {
    id: 'reference_api',
    path: '/reference/api',
    commonSectionsFile: 'common-api-sections.json',
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_auth',
    path: '/reference/self-hosting-auth',
    commonSectionsFile: 'common-self-hosting-auth-sections.json',
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_storage',
    path: '/reference/self-hosting-storage',
    commonSectionsFile: 'common-self-hosting-storage-sections.json',
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_realtime',
    path: '/reference/self-hosting-realtime',
    commonSectionsFile: 'common-self-hosting-realtime-sections.json',
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_analytics',
    path: '/reference/self-hosting-analytics',
    commonSectionsFile: 'common-self-hosting-analytics-sections.json',
    type: 'reference',
  },
  {
    id: 'reference_self_hosting_functions',
    path: '/reference/self-hosting-functions',
    commonSectionsFile: 'common-self-hosting-functions-sections.json',
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
