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
