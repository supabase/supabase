import { IS_PLATFORM } from '@/lib/constants'

interface ObservabilityMenuItem {
  name: string
  key: string
  url: string
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
          },
        ]
      : []),
    ...(isSupamonitorEnabled
      ? [
          {
            name: 'Query Insights',
            key: 'query-insights',
            url: `/project/${ref}/observability/query-insights${preservedQueryParams}`,
          },
        ]
      : [
          {
            name: 'Query Performance',
            key: 'query-performance',
            url: `/project/${ref}/observability/query-performance${preservedQueryParams}`,
          },
        ]),
    ...(isPlatform
      ? [
          {
            name: 'API Gateway',
            key: 'api-overview',
            url: `/project/${ref}/observability/api-overview${preservedQueryParams}`,
          },
        ]
      : []),
  ]

  const productItems: ObservabilityMenuItem[] = [
    {
      name: 'Database',
      key: 'database',
      url: `/project/${ref}/observability/database${preservedQueryParams}`,
    },
    {
      name: 'Data API',
      key: 'postgrest',
      url: `/project/${ref}/observability/postgrest${preservedQueryParams}`,
    },
    {
      name: 'Auth',
      key: 'auth',
      url: `/project/${ref}/observability/auth${preservedQueryParams}`,
    },
    {
      name: 'Edge Functions',
      key: 'edge-functions',
      url: `/project/${ref}/observability/edge-functions${preservedQueryParams}`,
    },
    ...(storageSupported
      ? [
          {
            name: 'Storage',
            key: 'storage',
            url: `/project/${ref}/observability/storage${preservedQueryParams}`,
          },
        ]
      : []),
    {
      name: 'Realtime',
      key: 'realtime',
      url: `/project/${ref}/observability/realtime${preservedQueryParams}`,
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
