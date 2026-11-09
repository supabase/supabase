import { useEffect, useRef, useState } from 'react'

import { AWAITING_DELIVERY_TIMEOUT_MS } from './PlatformWebhooks.constants'

/**
 * A test event or retry is queued, and its delivery lands in the table a moment later. While we
 * wait for it the table polls, so the action does not look like it did nothing. The API does not
 * tell us which delivery belongs to the action, so we wait for a fixed time.
 */
export const useAwaitingDelivery = () => {
  const [isAwaitingDelivery, setIsAwaitingDelivery] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const startAwaitingDelivery = () => {
    clearTimeout(timeoutRef.current)
    setIsAwaitingDelivery(true)
    timeoutRef.current = setTimeout(
      () => setIsAwaitingDelivery(false),
      AWAITING_DELIVERY_TIMEOUT_MS
    )
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return { isAwaitingDelivery, startAwaitingDelivery }
}
