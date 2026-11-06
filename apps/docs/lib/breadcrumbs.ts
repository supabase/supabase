import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { REFERENCES } from '~/content/navigation.references'

export interface BreadcrumbItem {
  name?: string
  title?: string
  url?: string
  icon?: string
  version?: ReferenceVersion
}

interface ReferenceVersion {
  library: string
  current: string
}

const SECTION_PATH_TO_KEY: Record<string, keyof typeof NavItems> = {
  ai: 'ai',
  'ai-tools': 'ai_tools',
  api: 'api',
  auth: 'auth',
  contributing: 'contributing',
  cron: 'cron',
  database: 'database',
  deployment: 'deployment',
  functions: 'functions',
  'getting-started': 'gettingstarted',
  graphql: 'graphql',
  integrations: 'integrations',
  'local-development': 'local_development',
  platform: 'platform',
  queues: 'queues',
  realtime: 'realtime',
  resources: 'resources',
  security: 'security',
  'self-hosting': 'self_hosting',
  storage: 'storage',
  observability: 'telemetry',
}

function getSectionMenu(pathname: string) {
  const trimmed = pathname.replace(/^\/guides\/?/, '')
  const top = trimmed.split('/')[0]
  const key = SECTION_PATH_TO_KEY[top] ?? 'gettingstarted'
  return (NavItems as Record<string, any>)[key]
}

function findMenuItemByUrl(
  menu: any,
  targetUrl: string,
  parents: BreadcrumbItem[] = []
): BreadcrumbItem[] | null {
  if (menu.items) {
    for (const item of menu.items) {
      const result = findMenuItemByUrl(item, targetUrl, [...parents, menu])
      if (result) return result
    }
  }
  if (menu.url === targetUrl) {
    return [...parents, menu]
  }
  return null
}

const getReferenceLibPath = (href: string) => href.split('/')[2]

export const getCrumbName = (crumb: BreadcrumbItem) => crumb.title || crumb.name

function resolveReferenceBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const libPath = getReferenceLibPath(pathname)
  const reference = Object.values(REFERENCES).find((reference) => reference.libPath === libPath)
  if (!reference) return []

  const referenceMenu = NavItems.GLOBAL_MENU_ITEMS.flat().find(
    (section) => section.label === 'Reference'
  )
  const library = (referenceMenu?.menuItems ?? [])
    .flat()
    .find(
      (item) =>
        item.href?.startsWith('/') &&
        item.enabled !== false &&
        getReferenceLibPath(item.href) === libPath
    )

  const versions: readonly string[] = reference.versions
  // an older version sits in the url after the library, and the latest has no segment
  const requestedVersion = pathname.split('/')[3]
  const version =
    versions.length > 1
      ? {
          library: libPath,
          current: versions.find((item) => item === requestedVersion) ?? versions[0],
        }
      : undefined

  return [
    { name: 'Home', url: '/reference' },
    library
      ? { name: library.label, url: library.href, icon: library.icon, version }
      : { name: reference.name, url: `/reference/${libPath}`, icon: reference.icon, version },
  ]
}

export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname.startsWith('/reference/')) {
    return resolveReferenceBreadcrumbs(pathname)
  }
  if (pathname.startsWith('/guides/getting-started/ai-prompts')) {
    return [
      { name: 'Getting started', url: '/guides/getting-started' },
      { name: 'AI Tools' },
      { name: 'Prompts', url: '/guides/getting-started/ai-prompts' },
    ]
  }
  if (pathname.startsWith('/guides/getting-started/ai-skills')) {
    return [
      { name: 'Getting started', url: '/guides/getting-started' },
      { name: 'AI Tools' },
      { name: 'Agent Skills', url: '/guides/getting-started/ai-skills' },
    ]
  }
  const menu = getSectionMenu(pathname)
  const chain = findMenuItemByUrl(menu, pathname) ?? []
  // an accordion and its first page can share a url and a name, so the chain would repeat it
  return chain.filter((crumb, index) => {
    const parent = chain[index - 1]
    return !parent || parent.url !== crumb.url || getCrumbName(parent) !== getCrumbName(crumb)
  })
}
