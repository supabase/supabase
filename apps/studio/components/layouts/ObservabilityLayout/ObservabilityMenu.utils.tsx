import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS, type ShortcutId } from '@/state/shortcuts/registry'

interface ObservabilityMenuItem {
  name: string
  key: string
  url: string
  shortcutId?: ShortcutId
}

export interface ObservabilityMenuSection {
  title: string
  key: string
  items: ObservabilityMenuItem[]
}

interface GenerateObservabilityMenuOptions {
  ref: string | undefined
  preservedQueryParams: string
  showOverview: boolean
  isSupamonitorEnabled: boolean
  storageSupported: boolean
  isPlatform?: boolean
}

export function generateObservabilityMenuItems(
  options: GenerateObservabilityMenuOptions
): ObservabilityMenuSection[] {
  const {
    ref,
    preservedQueryParams,
    showOverview,
    isSupamonitorEnabled,
    storageSupported,
    isPlatform = IS_PLATFORM,
  } = options

  const generalItems: ObservabilityMenuItem[] = [
    ...(showOverview
      ? [
          {
            name: 'Overview',
            key: 'observability',
            url: `/project/${ref}/observability${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_OVERVIEW,
          },
        ]
      : []),
    ...(isSupamonitorEnabled
      ? [
          {
            name: 'Query Insights',
            key: 'query-insights',
            url: `/project/${ref}/observability/query-insights${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_QUERY_PERFORMANCE,
          },
        ]
      : [
          {
            name: 'Query Performance',
            key: 'query-performance',
            url: `/project/${ref}/observability/query-performance${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_QUERY_PERFORMANCE,
          },
        ]),
    ...(isPlatform
      ? [
          {
            name: 'API Gateway',
            key: 'api-overview',
            url: `/project/${ref}/observability/api-overview${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_API_GATEWAY,
          },
        ]
      : []),
  ]

  const productItems: ObservabilityMenuItem[] = [
    {
      name: 'Database',
      key: 'database',
      url: `/project/${ref}/observability/database${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_DATABASE,
    },
    {
      name: 'Data API',
      key: 'postgrest',
      url: `/project/${ref}/observability/postgrest${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_DATA_API,
    },
    {
      name: 'Auth',
      key: 'auth',
      url: `/project/${ref}/observability/auth${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_AUTH,
    },
    {
      name: 'Edge Functions',
      key: 'edge-functions',
      url: `/project/${ref}/observability/edge-functions${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_FUNCTIONS,
    },
    ...(storageSupported
      ? [
          {
            name: 'Storage',
            key: 'storage',
            url: `/project/${ref}/observability/storage${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_STORAGE,
          },
        ]
      : []),
    {
      name: 'Realtime',
      key: 'realtime',
      url: `/project/${ref}/observability/realtime${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_REALTIME,
    },
  ]

  const sections: ObservabilityMenuSection[] = [
    {
      title: 'GENERAL',
      key: 'general-section',
      items: generalItems,
    },
  ]

  if (isPlatform) {
    sections.push({
      title: 'PRODUCT',
      key: 'product-section',
      items: productItems,
    })
  }

  return sections
}
