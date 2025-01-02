export type CloudProvider = 'FLY' | 'AWS'
export type Region = typeof AWS_REGIONS | typeof FLY_REGIONS

export const AWS_REGIONS = {
  WEST_US: {
    code: 'us-west-1',
    displayName: 'West US (North California)',
    location: [37.774929, -122.419418],
  },
  EAST_US: {
    code: 'us-east-1',
    displayName: 'East US (North Virginia)',
    location: [37.926868, -78.024902],
  },
  EAST_US_2: { code: 'us-east-2', displayName: 'East US (Ohio)', location: [39.9612, -82.9988] },
  CENTRAL_CANADA: {
    code: 'ca-central-1',
    displayName: 'Canada (Central)',
    location: [56.130367, -106.346771],
  },
  WEST_EU: { code: 'eu-west-1', displayName: 'West EU (Ireland)', location: [53.3498, -6.2603] },
  WEST_EU_2: {
    code: 'eu-west-2',
    displayName: 'West Europe (London)',
    location: [51.507351, -0.127758],
  },
  WEST_EU_3: { code: 'eu-west-3', displayName: 'West EU (Paris)', location: [2.352222, 48.856613] },
  CENTRAL_EU: {
    code: 'eu-central-1',
    displayName: 'Central EU (Frankfurt)',
    location: [50.110924, 8.682127],
  },
  CENTRAL_EU_2: {
    code: 'eu-central-2',
    displayName: 'Central Europe (Zurich)',
    location: [47.3744489, 8.5410422],
  },
  NORTH_EU: {
    code: 'eu-north-1',
    displayName: 'North EU (Stockholm)',
    location: [59.3251172, 18.0710935],
  },
  SOUTH_ASIA: {
    code: 'ap-south-1',
    displayName: 'South Asia (Mumbai)',
    location: [18.9733536, 72.8281049],
  },
  SOUTHEAST_ASIA: {
    code: 'ap-southeast-1',
    displayName: 'Southeast Asia (Singapore)',
    location: [1.357107, 103.8194992],
  },
  NORTHEAST_ASIA: {
    code: 'ap-northeast-1',
    displayName: 'Northeast Asia (Tokyo)',
    location: [35.6895, 139.6917],
  },
  NORTHEAST_ASIA_2: {
    code: 'ap-northeast-2',
    displayName: 'Northeast Asia (Seoul)',
    location: [37.5665, 126.978],
  },
  OCEANIA: {
    code: 'ap-southeast-2',
    displayName: 'Oceania (Sydney)',
    location: [-33.8688, 151.2093],
  },
  SOUTH_AMERICA: {
    code: 'sa-east-1',
    displayName: 'South America (São Paulo)',
    location: [-1.2043218, -47.1583944],
  },
} as const

export type AWS_REGIONS_KEYS = keyof typeof AWS_REGIONS

export const FLY_REGIONS = {
  SOUTHEAST_ASIA: { code: 'sin', displayName: 'Singapore', location: [1.3521, 103.8198] },
} as const
