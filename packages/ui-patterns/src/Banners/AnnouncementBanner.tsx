'use client'

import { Announcement } from './Announcement'
import announcementJSON from './data.json'
import { Select26Banner } from './Select26Banner'
import { SELECT_26_WWW_DISMISSAL_KEY, useSelect26PromotionActive } from './Select26Promotion'

export const announcement = announcementJSON

export const AnnouncementBanner = () => {
  const isActive = useSelect26PromotionActive()

  if (!isActive) return null

  return (
    <Announcement show announcementKey={SELECT_26_WWW_DISMISSAL_KEY}>
      <Select26Banner />
    </Announcement>
  )
}
