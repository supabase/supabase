import type { components } from 'api-types'

export type FeatureKey =
  components['schemas']['ListEntitlementsResponse']['entitlements'][number]['feature']['key']
export type Feature = (typeof Feature)[keyof typeof Feature]
