import { AWS_REGIONS, AWS_REGIONS_KEYS } from 'lib/constants'

export interface Region {
  key: AWS_REGIONS_KEYS
  name: string
  region: string
  coordinates: [number, number]
}

// ReactFlow is scaling everything by the factor of 2
export const NODE_WIDTH = 660
export const NODE_ROW_HEIGHT = 50
export const NODE_SEP = 20

// [Joshen] Coordinates from https://github.com/jsonmaur/aws-regions/issues/11
const AWS_REGIONS_COORDINATES: { [key: string]: [number, number] } = {
  SOUTHEAST_ASIA: [103.8, 1.37],
  NORTHEAST_ASIA: [139.42, 35.41],
  NORTHEAST_ASIA_2: [126.98, 37.56],
  CENTRAL_CANADA: [-73.6, 45.5],
  WEST_US: [-121.96, 37.35],
  EAST_US: [-78.45, 38.13],
  WEST_EU: [-8, 53],
  WEST_EU_2: [-0.1, 51],
  CENTRAL_EU: [8, 50],
  SOUTH_ASIA: [72.88, 19.08],
  OCEANIA: [151.2, -33.86],
  SOUTH_AMERICA: [-46.38, -23.34],
}

export const AWS_REGIONS_VALUES: { [key: string]: string } = {
  SOUTHEAST_ASIA: 'ap-southeast-1',
  NORTHEAST_ASIA: 'ap-northeast-1',
  NORTHEAST_ASIA_2: 'ap-northeast-2',
  CENTRAL_CANADA: 'ca-central-1',
  WEST_US: 'us-west-1',
  EAST_US: 'es-east-1',
  WEST_EU: 'eu-west-1',
  WEST_EU_2: 'eu-west-2',
  CENTRAL_EU: 'eu-central-1',
  SOUTH_ASIA: 'ap-south-1',
  OCEANIA: 'ap-southeast-2',
  SOUTH_AMERICA: 'sa-east-1',
}

// [Joshen] Just to make sure that we just depend on AWS_REGIONS to determine available
// regions for replicas. Just FYI - might need to update this if we support Fly in future
export const AVAILABLE_REPLICA_REGIONS: Region[] = Object.keys(AWS_REGIONS)
  .map((key) => {
    return {
      key: key as AWS_REGIONS_KEYS,
      name: AWS_REGIONS[key as AWS_REGIONS_KEYS],
      region: AWS_REGIONS_VALUES[key],
      coordinates: AWS_REGIONS_COORDINATES[key],
    }
  })
  .filter((x) => x.coordinates !== undefined)
