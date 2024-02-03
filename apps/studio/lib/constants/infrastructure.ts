import { components } from 'data/api'

export type CloudProvider = 'FLY' | 'AWS'
export type Region = typeof AWS_REGIONS | typeof FLY_REGIONS

// Alias regions remain as the starting point for project creation
// they are immediately translated to their respective cloud regions
// and are afterward never referred to

export const AWS_REGIONS = {
  WEST_US: 'West US (North California)',
  EAST_US: 'East US (North Virginia)',
  CENTRAL_CANADA: 'Canada (Central)',
  WEST_EU: 'West EU (Ireland)',
  WEST_EU_2: 'West EU (London)',
  // 'North EU': 'North EU',
  CENTRAL_EU: 'Central EU (Frankfurt)',
  SOUTH_ASIA: 'South Asia (Mumbai)',
  SOUTHEAST_ASIA: 'Southeast Asia (Singapore)',
  NORTHEAST_ASIA: 'Northeast Asia (Tokyo)',
  NORTHEAST_ASIA_2: 'Northeast Asia (Seoul)',
  OCEANIA: 'Oceania (Sydney)',
  SOUTH_AMERICA: 'South America (São Paulo)',
  // SOUTH_AFRICA: 'South Africa (Cape Town)',
} as const

export type AWS_REGIONS_KEYS = keyof typeof AWS_REGIONS

export const FLY_REGIONS = {
  SOUTHEAST_ASIA: 'Singapore',
} as const

export const AWS_REGIONS_DEFAULT =
  process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' ? AWS_REGIONS.SOUTHEAST_ASIA : AWS_REGIONS.WEST_US

// TO DO, change default to US region for prod
const FLY_REGIONS_DEFAULT = FLY_REGIONS.SOUTHEAST_ASIA

export const PRICING_TIER_LABELS_ORG = {
  FREE: 'Free - $0/month',
  PRO: 'Pro - $25/month',
  TEAM: 'Team - $599/month',
}

export const PRICING_TIER_PRODUCT_IDS = {
  FREE: 'tier_free',
  PRO: 'tier_pro',
  PAYG: 'tier_payg',
  TEAM: 'tier_team',
  ENTERPRISE: 'tier_enterprise',
}

export const DEFAULT_PROVIDER: CloudProvider =
  process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' ? 'FLY' : 'AWS'

export const PROVIDERS = {
  FLY: {
    id: 'FLY',
    name: 'Fly.io',
    default_region: FLY_REGIONS_DEFAULT,
    regions: { ...FLY_REGIONS },
  },
  AWS: {
    id: 'AWS',
    name: 'AWS',
    DEFAULT_SSH_KEY: 'supabase-app-instance',
    default_region: AWS_REGIONS_DEFAULT,
    regions: { ...AWS_REGIONS },
  },
} as const

export const PROJECT_STATUS: {
  [key: string]: components['schemas']['ProjectDetailResponse']['status']
} = {
  INACTIVE: 'INACTIVE',
  ACTIVE_HEALTHY: 'ACTIVE_HEALTHY',
  ACTIVE_UNHEALTHY: 'ACTIVE_UNHEALTHY',
  COMING_UP: 'COMING_UP',
  UNKNOWN: 'UNKNOWN',
  GOING_DOWN: 'GOING_DOWN',
  INIT_FAILED: 'INIT_FAILED',
  REMOVED: 'REMOVED',
  RESTORING: 'RESTORING',
  UPGRADING: 'UPGRADING',
  // @ts-ignore [Joshen] API codegen seems to be wrong here, pausing is still a valid status
  PAUSING: 'PAUSING',
  // @ts-ignore [Joshen] This is no longer part of the project status enum, but leaving here for now just in case
  RESTORATION_FAILED: 'RESTORATION_FAILED',
}

export const DEFAULT_MINIMUM_PASSWORD_STRENGTH = 4

export const PASSWORD_STRENGTH = {
  0: 'This password is not acceptable.',
  1: 'This password is not secure enough.',
  2: 'This password is not secure enough.',
  3: 'Not bad, but your password must be harder to guess.',
  4: 'This password is strong.',
}

export const PASSWORD_STRENGTH_COLOR = {
  0: 'bg-red-900',
  1: 'bg-red-900',
  2: 'bg-yellow-900',
  3: 'bg-yellow-900',
  4: 'bg-green-900',
}

export const PASSWORD_STRENGTH_PERCENTAGE = {
  0: '10%',
  1: '30%',
  2: '50%',
  3: '80%',
  4: '100%',
}

export const DEFAULT_PROJECT_API_SERVICE_ID = 1
