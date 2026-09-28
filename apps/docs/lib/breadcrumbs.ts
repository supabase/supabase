import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { REFERENCES } from '~/content/navigation.references'

export interface BreadcrumbItem {
  name?: string
  title?: string
  url?: string
  icon?: string
  items?: BreadcrumbItem[]
  enabled?: boolean
}

const SECTION_PATH_TO_KEY: Record<string, keyof typeof NavItems> = {
  ai: 'ai',
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

function resolveReferenceBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const libPath = getReferenceLibPath(pathname)
  const reference = Object.values(REFERENCES).find((reference) => reference.libPath === libPath)
  if (!reference) return []

  const referenceMenu = NavItems.GLOBAL_MENU_ITEMS.flat().find(
    (section) => section.label === 'Reference'
  )
  const libraries = (referenceMenu?.menuItems ?? [])
    .flat()
    .reduce<BreadcrumbItem[]>((libraries, item) => {
      if (item.href?.startsWith('/') && item.enabled !== false) {
        libraries.push({ name: item.label, url: item.href, icon: item.icon })
      }
      return libraries
    }, [])
  const library = libraries.find((item) => item.url && getReferenceLibPath(item.url) === libPath)

  return [
    { name: 'Reference', url: '/reference', items: libraries },
    library ?? { name: reference.name, url: `/reference/${libPath}`, icon: reference.icon },
  ]
}

export function resolveBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname.startsWith('/reference/')) {
    return resolveReferenceBreadcrumbs(pathname)
  }
  if (pathname.startsWith('/guides/troubleshooting')) {
    return [
      {
        name: 'Observability',
        url: '/guides/observability',
      },
      { name: 'Detect and diagnose' },
      { name: 'Diagnosing', url: '/guides/troubleshooting' },
    ]
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
  return findMenuItemByUrl(menu, pathname) ?? []
}
