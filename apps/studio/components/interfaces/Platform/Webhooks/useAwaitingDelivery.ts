import { useEffect, useRef, useState } from 'react'

import { AWAITING_DELIVERY_TIMEOUT_MS } from './PlatformWebhooks.constants'
import type { AwaitingDelivery } from './PlatformWebhooksPage.utils'

/**
 * A test event or retry is queued, and its delivery lands in the table a moment later. While we
 * wait for it the table polls, so the action does not look like it did nothing. Waiting ends when
 * a new row shows up, or after a timeout in case none ever does.
 */
export const useAwaitingDelivery = () => {
  const [awaitingDelivery, setAwaitingDelivery] = useState<AwaitingDelivery | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const startAwaitingDelivery = (newestDeliveryId?: string) => {
    clearTimeout(timeoutRef.current)
    setAwaitingDelivery({ newestDeliveryId })
    timeoutRef.current = setTimeout(() => setAwaitingDelivery(null), AWAITING_DELIVERY_TIMEOUT_MS)
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return { awaitingDelivery, startAwaitingDelivery }
}
