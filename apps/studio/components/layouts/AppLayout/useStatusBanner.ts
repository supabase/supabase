import { useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'

import {
  getKeysToDismiss,
  pruneDismissedKeys,
  selectBanner,
  type BannerSelection,
} from './StatusBanner.utils'
import { DEFAULT_STATUS_PAGE_URL } from '@/components/interfaces/Support/SupportStatus.utils'
import { statusPageQueryOptions } from '@/data/platform/status-page-query'
import { useEmergencyIncidentOverride } from '@/hooks/misc/useEmergencyIncidentOverride'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useUserProjectRegions } from '@/hooks/misc/useUserProjectRegions'
import { normalizeStatusPage } from '@/lib/status-page/status-page.utils'

export type StatusBannerState =
  | { type: 'override' }
  | { type: 'hidden' }
  | { type: 'shown'; selection: BannerSelection; pageUrl: string; onDismiss: () => void }

const HIDDEN: StatusBannerState = { type: 'hidden' }

export function useStatusBanner({
  signedOut = false,
}: { signedOut?: boolean } = {}): StatusBannerState {
  const isEmergencyOverride = useEmergencyIncidentOverride()

  const statusPageOptions = statusPageQueryOptions()
  const { data } = useQuery({
    ...statusPageOptions,
    select: normalizeStatusPage,
    enabled: statusPageOptions.enabled && !isEmergencyOverride,
  })

  const items = data?.items ?? []

  const userProjectRegions = useUserProjectRegions({
    enabled: !signedOut && !isEmergencyOverride && items.length > 0,
  })

  const [dismissedKeys, setDismissedKeys, { isSuccess: isDismissedKeysLoaded }] =
    useLocalStorageQuery<Array<string>>(LOCAL_STORAGE_KEYS.STATUS_BANNER_DISMISSED_KEYS, [])

  if (isEmergencyOverride) return { type: 'override' }

  if (data === undefined || !isDismissedKeysLoaded) return HIDDEN
  if (!signedOut && userProjectRegions.status === 'loading') return HIDDEN

  const selection = selectBanner({
    items,
    user: signedOut || userProjectRegions.status !== 'resolved' ? null : userProjectRegions.context,
    dismissedKeys: new Set(dismissedKeys),
    nowMs: Date.now(),
  })

  if (selection === null) return HIDDEN

  const onDismiss = () => {
    setDismissedKeys((prev) =>
      pruneDismissedKeys({ prev, allItems: items, add: getKeysToDismiss(selection) })
    )
  }

  return { type: 'shown', selection, pageUrl: DEFAULT_STATUS_PAGE_URL, onDismiss }
}
