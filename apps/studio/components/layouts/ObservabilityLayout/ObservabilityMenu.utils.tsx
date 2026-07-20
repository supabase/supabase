import { useFlag, useParams } from 'common'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useSupamonitorStatus } from '@/components/interfaces/QueryPerformance/hooks/useSupamonitorStatus'
import { useContentQuery, type Content, type ContentBase } from '@/data/content/content-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS, type ShortcutId } from '@/state/shortcuts/registry'
import { type Dashboards } from '@/types'

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

const usePreservedQueryParams = () => {
  const router = useRouter()

  // Preserve date range query parameters when navigating
  const preservedQueryParams = useMemo(() => {
    const { its, ite, isHelper, helperText } = router.query
    const params = new URLSearchParams()

    if (its && typeof its === 'string') params.set('its', its)
    if (ite && typeof ite === 'string') params.set('ite', ite)
    if (isHelper && typeof isHelper === 'string') params.set('isHelper', isHelper)
    if (helperText && typeof helperText === 'string') params.set('helperText', helperText)

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }, [router.query])

  return preservedQueryParams
}

export const useGenerateObservabilityMenu = () => {
  const { ref } = useParams()
  const preservedQueryParams = usePreservedQueryParams()

  const showOverview = useFlag('observabilityOverview')
  const topForPostgres = useFlag('topForPostgres')
  const { isSupamonitorEnabled } = useSupamonitorStatus()
  const storageSupported = useIsFeatureEnabled('project_storage:all')

  const baseUrl = `/project/${ref}/observability`

  const generalItems: ObservabilityMenuItem[] = [
    ...(showOverview
      ? [
          {
            name: 'Overview',
            key: 'observability',
            url: `${baseUrl}${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_OVERVIEW,
          },
        ]
      : []),
    ...(isSupamonitorEnabled
      ? [
          {
            name: 'Query Insights',
            key: 'query-insights',
            url: `${baseUrl}/query-insights${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_QUERY_PERFORMANCE,
          },
        ]
      : [
          {
            name: 'Query Performance',
            key: 'query-performance',
            url: `${baseUrl}/query-performance${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_QUERY_PERFORMANCE,
          },
        ]),
    ...(IS_PLATFORM
      ? [
          {
            name: 'API Gateway',
            key: 'api-overview',
            url: `${baseUrl}/api-overview${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_API_GATEWAY,
          },
        ]
      : []),
    ...(topForPostgres
      ? [
          {
            name: 'Database Connections',
            key: 'database-connections',
            url: `${baseUrl}/connections`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_API_GATEWAY,
          },
        ]
      : []),
  ]

  const productItems: ObservabilityMenuItem[] = [
    {
      name: 'Database',
      key: 'database',
      url: `${baseUrl}/database${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_DATABASE,
    },
    {
      name: 'Data API',
      key: 'postgrest',
      url: `${baseUrl}/postgrest${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_DATA_API,
    },
    {
      name: 'Auth',
      key: 'auth',
      url: `${baseUrl}/auth${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_AUTH,
    },
    {
      name: 'Edge Functions',
      key: 'edge-functions',
      url: `${baseUrl}/edge-functions${preservedQueryParams}`,
      shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_FUNCTIONS,
    },
    ...(storageSupported
      ? [
          {
            name: 'Storage',
            key: 'storage',
            url: `${baseUrl}/storage${preservedQueryParams}`,
            shortcutId: SHORTCUT_IDS.NAV_OBSERVABILITY_STORAGE,
          },
        ]
      : []),
    {
      name: 'Realtime',
      key: 'realtime',
      url: `${baseUrl}/realtime${preservedQueryParams}`,
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

  if (IS_PLATFORM) {
    sections.push({
      title: 'PRODUCT',
      key: 'product-section',
      items: productItems,
    })
  }

  return sections
}

function isReportContent(c: Content): c is ContentBase & {
  type: 'report'
  content: Dashboards.Content
} {
  return c.type === 'report'
}

export const useGenerateCustomReportsMenu = () => {
  const { ref } = useParams()
  const preservedQueryParams = usePreservedQueryParams()

  const { data: content, isPending: isLoading } = useContentQuery({
    projectRef: ref,
    type: 'report',
  })

  function getReportMenuItems() {
    if (!content) return []

    const reports = content?.content.filter(isReportContent)

    const sortedReports = reports?.sort((a, b) => {
      if (a.name < b.name) {
        return -1
      }
      if (a.name > b.name) {
        return 1
      }
      return 0
    })

    const reportMenuItems = sortedReports.map((r, idx) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      key: r.id || idx + '-report',
      url: `/project/${ref}/observability/${r.id}${preservedQueryParams}`,
      hasDropdownActions: true,
      report: r,
    }))

    return reportMenuItems
  }

  const data = getReportMenuItems()
  return { data, isLoading }
}
