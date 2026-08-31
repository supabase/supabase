import { safeSessionStorage } from 'common'

export const EXPLORER_BANNER_EXPOSURE_SESSION_KEY = 'explorer-banner-exposure-tracked'

export const claimExplorerBannerSessionExposure = () => {
  if (safeSessionStorage.getItem(EXPLORER_BANNER_EXPOSURE_SESSION_KEY) !== null) return false

  safeSessionStorage.setItem(EXPLORER_BANNER_EXPOSURE_SESSION_KEY, 'true')
  return true
}
