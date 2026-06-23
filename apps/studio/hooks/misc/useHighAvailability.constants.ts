import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

export const MULTIGRES_SCHEMA_NAME = 'multigres'

/** Dev-only override for testing HA UI. Set to `true`/`false` to force, or `undefined` to use API data. */
export const MOCK_HIGH_AVAILABILITY: boolean | undefined = IS_STAGING_OR_LOCAL ? true : undefined

const formatFeatureForDescription = (feature: string) => {
  if (feature === 'This feature') return 'this feature'
  return feature.charAt(0).toLowerCase() + feature.slice(1)
}

export function getHighAvailabilityDisabledTitle(feature: string) {
  return `${feature} unavailable on High Availability projects`
}

export function getHighAvailabilityDisabledDescription(
  feature: string,
  { suffix }: { suffix?: string } = {}
) {
  const description = `We're working to bring ${formatFeatureForDescription(feature)} to High Availability projects. Contact support if this is blocking your work.`

  return suffix ? `${description} ${suffix}` : description
}

export function getHighAvailabilityDisabledTooltip(feature: string) {
  return getHighAvailabilityDisabledTitle(feature)
}

export const HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES = {
  noticeTitle: 'Adding read replicas is disabled',
  noticeDescription:
    'This project already has two failover replicas. Existing destinations remain read-only.',
  addDestinationTooltip:
    'Adding read replicas is disabled — this project already has two failover replicas',
} as const

export const HIGH_AVAILABILITY_DISABLED_MESSAGES = {
  title: getHighAvailabilityDisabledTitle('This feature'),
  description: getHighAvailabilityDisabledDescription('This feature'),
  sectionTooltip: getHighAvailabilityDisabledTooltip('This feature'),
} as const

export function resolveHighAvailability(project?: { high_availability?: boolean | null }) {
  return MOCK_HIGH_AVAILABILITY ?? project?.high_availability ?? false
}
