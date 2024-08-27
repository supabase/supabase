import { AWS_REGIONS, AWS_REGIONS_DEFAULT, FLY_REGIONS, FLY_REGIONS_DEFAULT } from './regions'

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
