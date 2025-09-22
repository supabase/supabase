import { type NavMenuConstant } from '~/components/Navigation/Navigation.types'
import {
  GLOBAL_MENU_ITEMS,
  ai,
  api,
  auth,
  cron,
  database,
  deployment,
  functions,
  gettingstarted,
  graphql,
  integrations,
  local_development,
  platform,
  queues,
  realtime,
  security,
  self_hosting,
  storage,
  telemetry,
} from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'

// Map of section names to their nav constants
const SECTION_NAV_MAPS: Record<string, NavMenuConstant> = {
  ai,
  api,
  auth,
  cron,
  database,
  deployment,
  functions,
  'getting-started': gettingstarted,
  graphql,
  integrations,
  'local-development': local_development,
  platform,
  queues,
  realtime,
  security,
  'self-hosting': self_hosting,
  storage,
  telemetry,
}

interface ConditionalNavItem {
  url?: string
  href?: string
  enabled?: boolean
  items?: Readonly<ConditionalNavItem[]>
  menuItems?: Readonly<ConditionalNavItem[][]>
}

/**
 * Recursively walks navigation items and collects all disabled paths.
 * If a parent is disabled, all its children are also considered disabled.
 */
function collectDisabledPaths(
  items: Readonly<ConditionalNavItem[] | ConditionalNavItem[][]>,
  disabledPaths: Set<string>,
  parentDisabled: boolean = false
): void {
  for (const item of items) {
    if (Array.isArray(item)) {
      // Handle nested arrays (like in GLOBAL_MENU_ITEMS)
      collectDisabledPaths(item, disabledPaths, parentDisabled)
    } else {
      const isCurrentDisabled = parentDisabled || item.enabled === false
      const itemUrl = item.url || item.href

      if (itemUrl && itemUrl.startsWith('/guides/')) {
        const normalizedUrl = normalizeUrl(itemUrl)
        if (isCurrentDisabled) {
          disabledPaths.add(normalizedUrl)
        }
      }

      // Recursively check children, passing down the disabled status
      if (item.items) {
        collectDisabledPaths(item.items, disabledPaths, isCurrentDisabled)
      }
      if (item.menuItems) {
        collectDisabledPaths(item.menuItems, disabledPaths, isCurrentDisabled)
      }
    }
  }
}

/**
 * Normalizes URLs for comparison by removing leading/trailing slashes and ensuring consistent format
 */
function normalizeUrl(url: string): string {
  return url.replace(/^\/+|\/+$/g, '').toLowerCase()
}

/**
 * Creates and caches the set of all disabled guide paths.
 * This is computed once and reused across all checks.
 */
let cachedDisabledPaths: Set<string> | null = null

function getDisabledGuidePaths(): Set<string> {
  if (cachedDisabledPaths === null) {
    cachedDisabledPaths = new Set<string>()

    // Collect disabled paths from global menu items
    collectDisabledPaths(GLOBAL_MENU_ITEMS, cachedDisabledPaths)

    // Collect disabled paths from section-specific navigation
    Object.values(SECTION_NAV_MAPS).forEach((sectionNav) => {
      if (sectionNav.items) {
        collectDisabledPaths([sectionNav], cachedDisabledPaths!)
      }
    })
  }

  return cachedDisabledPaths
}

/**
 * Checks if a guides page is enabled based on the navigation menu configuration
 *
 * @param guidesPath - The path to the guides page (e.g., "/guides/auth/users")
 * @returns true if enabled, false if disabled
 */
export function checkGuidePageEnabled(guidesPath: string): boolean {
  const disabledPaths = getDisabledGuidePaths()
  const normalizedPath = normalizeUrl(guidesPath)
  return !disabledPaths.has(normalizedPath)
}
