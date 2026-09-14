import type { AWS_REGIONS_KEYS } from 'shared-data'
import { AWS_REGIONS } from 'shared-data'

export const REGION_GROUPS = ['Americas', 'Europe', 'Asia Pacific'] as const

export type RegionGroup = (typeof REGION_GROUPS)[number]

export interface RegionDetails {
  key: AWS_REGIONS_KEYS
  code: string
  displayName: string
  group: RegionGroup
  /** Legal jurisdiction, for the European regions only */
  jurisdiction?: string
}

export interface MappedRegion extends RegionDetails {
  /** [longitude, latitude] */
  coordinates: [number, number]
}

// [longitude, latitude], from https://github.com/tobilg/aws-edge-locations — the same
// source the infrastructure map in the dashboard uses
const REGION_COORDINATES: Partial<Record<AWS_REGIONS_KEYS, [number, number]>> = {
  SOUTHEAST_ASIA: [103.8, 1.37],
  NORTHEAST_ASIA: [139.42, 35.41],
  NORTHEAST_ASIA_2: [126.98, 37.56],
  CENTRAL_CANADA: [-73.6, 45.5],
  WEST_US: [-121.96, 37.35],
  WEST_US_2: [-122.67, 45.51],
  EAST_US: [-78.45, 38.13],
  EAST_US_2: [-83, 39.96],
  WEST_EU: [-8, 53],
  WEST_EU_2: [-0.1, 51],
  WEST_EU_3: [2.35, 48.86],
  CENTRAL_EU: [8, 50],
  CENTRAL_EU_2: [8.54, 47.45],
  NORTH_EU: [17.91, 59.65],
  SOUTH_ASIA: [72.88, 19.08],
  OCEANIA: [151.2, -33.86],
  SOUTH_AMERICA: [-46.38, -23.34],
}

const REGION_JURISDICTIONS: Record<string, string> = {
  'eu-central-1': 'EU',
  'eu-central-2': 'CH',
  'eu-north-1': 'EU',
  'eu-west-1': 'EU',
  'eu-west-2': 'UK',
  'eu-west-3': 'EU',
}

const groupForCode = (code: string): RegionGroup => {
  if (code.startsWith('eu-')) return 'Europe'
  if (code.startsWith('ap-')) return 'Asia Pacific'
  return 'Americas'
}

export const REGIONS: RegionDetails[] = (Object.keys(AWS_REGIONS) as AWS_REGIONS_KEYS[]).map(
  (key) => ({
    key,
    code: AWS_REGIONS[key].code,
    displayName: AWS_REGIONS[key].displayName,
    group: groupForCode(AWS_REGIONS[key].code),
    jurisdiction: REGION_JURISDICTIONS[AWS_REGIONS[key].code],
  })
)

export const REGION_COUNT = REGIONS.length

/** Valid values for the `region` query param */
export const REGION_CODES = REGIONS.map((region) => region.code)

export const GROUPED_REGIONS = REGION_GROUPS.map((group) => ({
  group,
  regions: REGIONS.filter((region) => region.group === group),
}))

/** Regions we have coordinates for, i.e. the ones the map can plot */
export const MAPPED_REGIONS: MappedRegion[] = REGIONS.flatMap((region) => {
  const coordinates = REGION_COORDINATES[region.key]
  return coordinates === undefined ? [] : [{ ...region, coordinates }]
})

export const RESIDENCY_ROWS: {
  component: string
  status: 'In region' | 'Your choice' | 'Global'
  detail: string
}[] = [
  {
    component: 'Primary Postgres database',
    status: 'In region',
    detail: 'Stays in the region you picked.',
  },
  {
    component: 'Auth service',
    status: 'In region',
    detail: 'Stays in the region you picked.',
  },
  {
    component: 'Storage objects at origin',
    status: 'In region',
    detail: 'Stays in the region you picked.',
  },
  {
    component: 'Read replicas',
    status: 'Your choice',
    detail: 'You choose the region. It can sit outside the EU.',
  },
  {
    component: 'Edge Functions',
    status: 'Global',
    detail: 'Runs at the edge nearest the caller.',
  },
  {
    component: 'Edge Functions with regional invocation',
    status: 'Your choice',
    detail: 'You can pin execution to a region. Not available in Ohio or Stockholm.',
  },
  {
    component: 'Storage CDN cache',
    status: 'Global',
    detail: 'Cached on Cloudflare, globally.',
  },
]

export const DOCUMENTS = [
  {
    href: '/legal/dpa',
    label: 'Data Processing Agreement',
    description: 'The contract that covers how we process your data.',
  },
  {
    href: 'https://supabase.com/docs/guides/security/gdpr-compliance',
    label: 'GDPR guide',
    description: 'What GDPR compliance takes on Supabase.',
  },
  {
    href: '/legal/customer-resources/subprocessor-list',
    label: 'Sub-processor list',
    description: 'Every vendor that can touch customer data.',
  },
  {
    href: '/security',
    label: 'Security',
    description: 'Certifications, controls, and reporting a vulnerability.',
  },
]
