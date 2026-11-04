import { useQuery } from '@tanstack/react-query'

import {
  getStatusPillLabel,
  getSupportAdmonitionCopy,
  prioritizeActiveItems,
  type SupportStatus,
} from './SupportStatus.utils'
import { statusPageQueryOptions } from '@/data/platform/status-page-query'
import { IS_PLATFORM } from '@/lib/constants'
import { normalizeStatusPage } from '@/lib/status-page/status-page.utils'

export function useSupportStatus(): SupportStatus {
  const statusQuery = useQuery({
    ...statusPageQueryOptions(),
    select: normalizeStatusPage,
    enabled: IS_PLATFORM,
  })

  if (statusQuery.isPending) return { status: 'pending' }
  if (statusQuery.isError) return { status: 'error' }

  const { pageUrl, items } = statusQuery.data
  const activeItems = prioritizeActiveItems(items)

  return {
    status: 'success',
    hasActiveIncidents: activeItems.some((item) => item.kind === 'incident'),
    pillLabel: getStatusPillLabel(items),
    admonition: getSupportAdmonitionCopy(items),
    pageUrl,
  }
}
