export type CloudProvider = 'FLY' | 'AWS'
export type Region = typeof AWS_REGIONS | typeof FLY_REGIONS

export const AWS_REGIONS = {
  WEST_US: {
    code: 'us-west-1',
    displayName: 'West US (North California)',
    location: [-122.4194, 37.7749],
  },
  EAST_US: {
    code: 'us-east-1',
    displayName: 'East US (North Virginia)',
    location: [-78.6569, 37.4316],
  },
  EAST_US_2: { code: 'us-east-2', displayName: 'East US (Ohio)', location: [-82.9988, 39.9612] },
  CENTRAL_CANADA: {
    code: 'ca-central-1',
    displayName: 'Canada (Central)',
    location: [-79.3832, 43.6532],
  },
  WEST_EU: { code: 'eu-west-1', displayName: 'West EU (Ireland)', location: [-6.2603, 53.3498] },
  WEST_EU_2: {
    code: 'eu-west-2',
    displayName: 'West Europe (London)',
    location: [-0.1276, 51.5074],
  },
  WEST_EU_3: { code: 'eu-west-3', displayName: 'West EU (Paris)', location: [2.3522, 48.8566] },
  CENTRAL_EU: {
    code: 'eu-central-1',
    displayName: 'Central EU (Frankfurt)',
    location: [8.6821, 50.1109],
  },
  CENTRAL_EU_2: {
    code: 'eu-central-2',
    displayName: 'Central Europe (Zurich)',
    location: [8.5417, 47.3769],
  },
  NORTH_EU: {
    code: 'eu-north-1',
    displayName: 'North EU (Stockholm)',
    location: [18.0686, 59.3293],
  },
  SOUTH_ASIA: {
    code: 'ap-south-1',
    displayName: 'South Asia (Mumbai)',
    location: [72.8777, 19.076],
  },
  SOUTHEAST_ASIA: {
    code: 'ap-southeast-1',
    displayName: 'Southeast Asia (Singapore)',
    location: [103.8198, 1.3521],
  },
  NORTHEAST_ASIA: {
    code: 'ap-northeast-1',
    displayName: 'Northeast Asia (Tokyo)',
    location: [139.6917, 35.6895],
  },
  NORTHEAST_ASIA_2: {
    code: 'ap-northeast-2',
    displayName: 'Northeast Asia (Seoul)',
    location: [126.978, 37.5665],
  },
  OCEANIA: {
    code: 'ap-southeast-2',
    displayName: 'Oceania (Sydney)',
    location: [151.2093, -33.8688],
  },
  SOUTH_AMERICA: {
    code: 'sa-east-1',
    displayName: 'South America (São Paulo)',
    location: [-46.6333, -23.5505],
  },
} as const

export type AWS_REGIONS_KEYS = keyof typeof AWS_REGIONS

export const FLY_REGIONS = {
  SOUTHEAST_ASIA: { code: 'sin', displayName: 'Singapore', location: [103.8198, 1.3521] },
} as const
