'use client'

import { useEffect, useState } from 'react'

import { Announcement } from './Announcement'
import announcementJSON from './data.json'
import { Select26Banner } from './Select26Banner'
import {
  SELECT_26_LIVESTREAM_WWW_DISMISSAL_KEY,
  SELECT_26_WWW_DISMISSAL_KEY,
  useSelect26PromotionPhase,
} from './Select26Promotion'
import {
  TOS_UPDATE_EFFECTIVE_DATE,
  TOS_UPDATE_WWW_DISMISSAL_KEY,
  TosUpdateBanner,
} from './TosUpdateBanner'

export const announcement = announcementJSON

const TOS_UPDATE_EFFECTIVE_MS = new Date(TOS_UPDATE_EFFECTIVE_DATE).getTime()
const MAX_TIMEOUT_MS = 2_147_483_647

/** True once we've crossed the ToS v4 effective date, re-checked on a timer so the banner appears without a refresh. */
const useIsTosUpdateLive = () => {
  const [isLive, setIsLive] = useState(() => Date.now() >= TOS_UPDATE_EFFECTIVE_MS)

  useEffect(() => {
    if (isLive) return

    const delay = TOS_UPDATE_EFFECTIVE_MS - Date.now()
    if (delay <= 0) {
      setIsLive(true)
      return
    }

    const timeoutId = setTimeout(() => setIsLive(true), Math.min(delay, MAX_TIMEOUT_MS))
    return () => clearTimeout(timeoutId)
  }, [isLive])

  return isLive
}

export const AnnouncementBanner = () => {
  const select26Phase = useSelect26PromotionPhase()
  const isTosUpdateLive = useIsTosUpdateLive()

  if (select26Phase !== 'ended') {
    const dismissalKey =
      select26Phase === 'livestream'
        ? SELECT_26_LIVESTREAM_WWW_DISMISSAL_KEY
        : SELECT_26_WWW_DISMISSAL_KEY

    return (
      <Announcement key={dismissalKey} show announcementKey={dismissalKey}>
        <Select26Banner phase={select26Phase} />
      </Announcement>
    )
  }

  if (isTosUpdateLive) {
    return (
      <Announcement
        key={TOS_UPDATE_WWW_DISMISSAL_KEY}
        show
        announcementKey={TOS_UPDATE_WWW_DISMISSAL_KEY}
      >
        <TosUpdateBanner />
      </Announcement>
    )
  }

  return null
}
