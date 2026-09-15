'use client'

import { Announcement } from './Announcement'
import announcementJSON from './data.json'
import { PrivacyPolicyBanner } from './PrivacyPolicyBanner'
import {
  PRIVACY_POLICY_BANNER_DISMISSAL_KEY,
  usePrivacyPolicyBannerActive,
} from './PrivacyPolicyPromotion'
import { Select26Banner } from './Select26Banner'
import { SELECT_26_WWW_DISMISSAL_KEY, useSelect26PromotionActive } from './Select26Promotion'

export const announcement = announcementJSON

export const AnnouncementBanner = () => {
  const isPrivacyPolicyBannerActive = usePrivacyPolicyBannerActive()
  const isSelect26Active = useSelect26PromotionActive()

  // The Privacy Policy notice is a compliance notice, so it takes priority over promotional
  // banners while it's live.
  if (isPrivacyPolicyBannerActive) {
    return (
      <Announcement show announcementKey={PRIVACY_POLICY_BANNER_DISMISSAL_KEY}>
        <PrivacyPolicyBanner />
      </Announcement>
    )
  }

  if (isSelect26Active) {
    return (
      <Announcement show announcementKey={SELECT_26_WWW_DISMISSAL_KEY}>
        <Select26Banner />
      </Announcement>
    )
  }

  return null
}
