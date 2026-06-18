import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { NavMenuConstant } from '~/components/Navigation/Navigation.types'
import {
  ai,
  ai_tools,
  api,
  auth,
  cli,
  cron,
  database,
  deployment,
  functions,
  gettingstarted,
  integrations,
  local_development,
  platform,
  queues,
  realtime,
  resources,
  security,
  self_hosting,
  storage,
  telemetry,
} from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'

import { GUIDES_DIRECTORY } from './docs'

interface NavWalkItem {
  name?: string
  url?: string
  items?: Readonly<NavWalkItem[]>
}

/** Section nav trees to walk. Excludes graphql (federated). Includes resources and cli. */
const GUIDE_SECTION_NAV: ReadonlyArray<NavMenuConstant | NavWalkItem> = [
  ai,
  api,
  auth,
  cron,
  database,
  deployment,
  functions,
  gettingstarted,
  integrations,
  ai_tools,
  local_development,
  platform,
  queues,
  realtime,
  security,
  self_hosting,
  storage,
  telemetry,
  resources,
  cli,
]

function isGettingStartedHub(name: string, url: string): boolean {
  if (name.toLowerCase() !== 'getting started') {
    return false
  }

  const path = url.replace(/\/+$/, '').toLowerCase()
  return (
    path.endsWith('/overview') ||
    path.endsWith('/introduction') ||
    path.endsWith('/getting_started')
  )
}

function isNamedHubItem(name: string | undefined, url: string | undefined): boolean {
  if (!name || !url || !url.startsWith('/guides/')) {
    return false
  }

  const normalizedName = name.toLowerCase()

  if (normalizedName === 'overview' || normalizedName === 'introduction') {
    return true
  }

  return isGettingStartedHub(name, url)
}

function collectHubUrlsFromItems(items: ReadonlyArray<NavWalkItem>, urls: Set<string>): void {
  for (const item of items) {
    if (item.url && isNamedHubItem(item.name, item.url)) {
      urls.add(item.url)
    }

    if (item.items) {
      collectHubUrlsFromItems(item.items, urls)
    }
  }
}

function collectSectionRootUrl(section: NavMenuConstant | NavWalkItem, urls: Set<string>): void {
  if (section.url?.startsWith('/guides/')) {
    urls.add(section.url)
  }
}

function guidesUrlToMdxPath(url: string): string {
  return `${url.replace(/^\/guides\//, '').replace(/\/+$/, '')}.mdx`
}

/**
 * Derives overview/index MDX paths (relative to content/guides/) from navigation constants.
 * Conservative rules: section roots, Overview/Introduction items, and Getting started hubs
 * whose URL ends with /overview, /introduction, or /getting_started.
 */
export function deriveOverviewPagePaths(): string[] {
  const urls = new Set<string>()

  for (const section of GUIDE_SECTION_NAV) {
    collectSectionRootUrl(section, urls)

    if (section.items) {
      collectHubUrlsFromItems(section.items, urls)
    }
  }

  return [...urls]
    .filter((url) => url.startsWith('/guides/'))
    .map(guidesUrlToMdxPath)
    .filter((relPath) => existsSync(join(GUIDES_DIRECTORY, relPath)))
    .sort()
}
