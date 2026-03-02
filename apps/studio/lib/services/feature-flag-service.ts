import { getFlags } from 'common/configcat'
import { getFeatureFlags, type CallFeatureFlagsResponse } from 'common/feature-flags'

import { API_URL } from '@/lib/constants'

type ConfigCatFlag = {
  settingKey: string
  settingValue: boolean | number | string | null | undefined
}

export interface FeatureFlagService {
  /** Fetches ConfigCat flags. Passed directly to FeatureFlagProvider as getConfigCatFlags. */
  getConfigCatFlags: (userEmail?: string) => Promise<ConfigCatFlag[]>
  /** Fetches PostHog flags. Will be passed to FeatureFlagProvider as getPostHogFlags */
  getPostHogFlags: (options?: {
    organizationSlug?: string
    projectRef?: string
  }) => Promise<CallFeatureFlagsResponse>
}

export const featureFlagServiceLive: FeatureFlagService = {
  getConfigCatFlags: (userEmail) => getFlags(userEmail),
  getPostHogFlags: (options) => getFeatureFlags(API_URL, options),
}
