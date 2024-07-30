export type CloudProvider = 'FLY' | 'AWS'
export type Region = typeof AWS_REGIONS | typeof FLY_REGIONS

export const AWS_REGIONS = {
  WEST_US: { code: 'us-west-1', displayName: 'West US (North California)' },
  EAST_US: { code: 'us-east-1', displayName: 'East US (North Virginia)' },
  CENTRAL_CANADA: { code: 'ca-central-1', displayName: 'Canada (Central)' },
  WEST_EU: { code: 'eu-west-1', displayName: 'West EU (Ireland)' },
  WEST_EU_2: { code: 'eu-west-2', displayName: 'West EU (London)' },
  CENTRAL_EU: { code: 'eu-central-1', displayName: 'Central EU (Frankfurt)' },
  SOUTH_ASIA: { code: 'ap-south-1', displayName: 'South Asia (Mumbai)' },
  SOUTHEAST_ASIA: { code: 'ap-southeast-1', displayName: 'Southeast Asia (Singapore)' },
  NORTHEAST_ASIA: { code: 'ap-northeast-1', displayName: 'Northeast Asia (Tokyo)' },
  NORTHEAST_ASIA_2: { code: 'ap-northeast-2', displayName: 'Northeast Asia (Seoul)' },
  OCEANIA: { code: 'ap-southeast-2', displayName: 'Oceania (Sydney)' },
  SOUTH_AMERICA: { code: 'sa-east-1', displayName: 'South America (São Paulo)' },
} as const

export type AWS_REGIONS_KEYS = keyof typeof AWS_REGIONS

export const FLY_REGIONS = {
  SOUTHEAST_ASIA: { code: 'sin', displayName: 'Singapore' },
} as const
