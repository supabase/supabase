import type { CloudProvider } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'

import type { components } from 'data/api'

export const AWS_REGIONS_DEFAULT =
  process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' ? AWS_REGIONS.SOUTHEAST_ASIA : AWS_REGIONS.EAST_US

// TO DO, change default to US region for prod
export const FLY_REGIONS_DEFAULT = FLY_REGIONS.SOUTHEAST_ASIA

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

export const DEFAULT_PROVIDER: CloudProvider = 'AWS'

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
  [key: string]: components['schemas']['ResourceWithServicesStatusResponse']['status']
} = {
  INACTIVE: 'INACTIVE',
  ACTIVE_HEALTHY: 'ACTIVE_HEALTHY',
  ACTIVE_UNHEALTHY: 'ACTIVE_UNHEALTHY',
  COMING_UP: 'COMING_UP',
  UNKNOWN: 'UNKNOWN',
  GOING_DOWN: 'GOING_DOWN',
  INIT_FAILED: 'INIT_FAILED',
  REMOVED: 'REMOVED',
  RESTARTING: 'RESTARTING',
  RESTORING: 'RESTORING',
  RESTORE_FAILED: 'RESTORE_FAILED',
  UPGRADING: 'UPGRADING',
  PAUSING: 'PAUSING',
  PAUSE_FAILED: 'PAUSE_FAILED',
  RESIZING: 'RESIZING',
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

export type InstanceSpecs = {
  baseline_disk_io_mbs: number
  connections_direct: number
  connections_pooler: number
  cpu_cores: number | 'Shared'
  cpu_dedicated: boolean
  max_disk_io_mbs: number
  memory_gb: number
}

export const INSTANCE_NANO_SPECS: InstanceSpecs = {
  baseline_disk_io_mbs: 43,
  connections_direct: 30,
  connections_pooler: 200,
  cpu_cores: 'Shared',
  cpu_dedicated: false,
  max_disk_io_mbs: 2085,
  memory_gb: 0.5,
}

export const INSTANCE_MICRO_SPECS: InstanceSpecs = {
  baseline_disk_io_mbs: 87,
  connections_direct: 60,
  connections_pooler: 200,
  cpu_cores: 2,
  cpu_dedicated: false,
  max_disk_io_mbs: 2085,
  memory_gb: 1,
}
