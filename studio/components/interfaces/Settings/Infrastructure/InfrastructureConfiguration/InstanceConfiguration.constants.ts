export interface DatabaseConfiguration {
  id: number
  type: 'PRIMARY' | 'READ_REPLICA'
  cloud_provider: 'AWS' | 'FLY'
  region: string
  size: string
  status: string
  inserted_at: string
}

export const MOCK_DATABASES: DatabaseConfiguration[] = [
  {
    id: 1,
    type: 'PRIMARY',
    cloud_provider: 'AWS',
    region: 'ap-southeast-1b',
    size: 't4g.micro',
    status: 'ACTIVE_HEALTHY',
    inserted_at: '2023-11-01 06:47:46.837002',
  },
  {
    id: 2,
    type: 'READ_REPLICA',
    cloud_provider: 'AWS',
    region: 'ap-southeast-1b',
    size: 't4g.micro',
    status: 'ACTIVE_HEALTHY',
    inserted_at: '2023-11-01 06:47:46.837002',
  },
  {
    id: 3,
    type: 'READ_REPLICA',
    cloud_provider: 'AWS',
    region: 'us-west-1',
    size: 't4g.micro',
    status: 'ACTIVE_HEALTHY',
    inserted_at: '2023-11-01 06:47:46.837002',
  },
  {
    id: 4,
    type: 'READ_REPLICA',
    cloud_provider: 'AWS',
    region: 'ap-southeast-1b',
    size: 't4g.micro',
    status: 'ACTIVE_HEALTHY',
    inserted_at: '2023-11-01 06:47:46.837002',
  },
]

// [Joshen] FYI coordinates are manually eye-balled, but I don't think they need to be absolutely accurate
export const MOCK_AVAILABLE_REPLICA_REGIONS: {
  coordinates: [number, number]
  key: string
  country: string
}[] = [
  { coordinates: [104, 1], key: 'SOUTHEAST_ASIA', country: 'Singapore' },
  { coordinates: [139, 36], key: 'NORTHEAST_ASIA', country: 'Tokyo' },
  { coordinates: [128, 36], key: 'NORTHEAST_ASIA_2', country: 'Seoul' },
  { coordinates: [-120, 60], key: 'CENTRAL_CANADA', country: 'Canada' },
  { coordinates: [-120, 35], key: 'WEST_US', country: 'West US' },
  { coordinates: [-77, 35], key: 'EAST_US', country: 'East US' },
]

export const MOCK_CREATED_REGIONS: {
  name: string
  coordinates: [number, number]
  key: string
  country: string
}[] = [
  { name: 'Primary', coordinates: [104, 1], key: 'SOUTHEAST_ASIA', country: 'Singapore' },
  { name: 'Replica #1', coordinates: [139, 36], key: 'NORTHEAST_ASIA', country: 'Tokyo' },
  { name: 'Replica #2', coordinates: [-100, 47], key: 'CENTRAL_CANADA', country: 'Canada' },
]
