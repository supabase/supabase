'use client'

import { Announcement } from './Announcement'
import announcementJSON from './data.json'
import { Select26Banner } from './Select26Banner'
import {
  SELECT_26_LIVESTREAM_WWW_DISMISSAL_KEY,
  SELECT_26_WWW_DISMISSAL_KEY,
  useSelect26PromotionPhase,
} from './Select26Promotion'

export const announcement = announcementJSON

export const AnnouncementBanner = () => {
  const phase = useSelect26PromotionPhase()

  if (phase === 'ended') return null

  const dismissalKey =
    phase === 'livestream' ? SELECT_26_LIVESTREAM_WWW_DISMISSAL_KEY : SELECT_26_WWW_DISMISSAL_KEY

  return (
    <Announcement key={dismissalKey} show announcementKey={dismissalKey}>
      <Select26Banner phase={phase} />
    </Announcement>
  )
}
