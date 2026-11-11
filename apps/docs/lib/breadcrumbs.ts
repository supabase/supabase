import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'

export interface BreadcrumbItem {
  name?: string
  title?: string
  url?: string
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

function getSectionMenu(pathname: string, navItems: typeof NavItems) {
  const trimmed = pathname.replace(/^\/guides\/?/, '')
  const top = trimmed.split('/')[0]
  const key = SECTION_PATH_TO_KEY[top] ?? 'gettingstarted'
  return (navItems as Record<string, any>)[key]
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

export function resolveBreadcrumbs(
  pathname: string,
  navItems: typeof NavItems = NavItems
): BreadcrumbItem[] {
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
  const menu = getSectionMenu(pathname, navItems)
  return findMenuItemByUrl(menu, pathname) ?? []
}
