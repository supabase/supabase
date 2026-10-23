import { z } from 'zod'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM, OPT_IN_TAGS } from '@/lib/constants'

export const aiOptInLevelSchema = z.enum([
  'disabled',
  'schema',
  'schema_and_log',
  'schema_and_log_and_data',
])

export type AiOptInLevel = z.infer<typeof aiOptInLevelSchema>

export const getAiOptInLevel = (tags: string[] | undefined): AiOptInLevel => {
  const hasSql = tags?.includes(OPT_IN_TAGS.AI_SQL)
  const hasData = tags?.includes(OPT_IN_TAGS.AI_DATA)
  const hasLog = tags?.includes(OPT_IN_TAGS.AI_LOG)

  if (hasData) {
    return 'schema_and_log_and_data'
  } else if (hasLog) {
    return 'schema_and_log'
  } else if (hasSql) {
    return 'schema'
  } else {
    return 'disabled'
  }
}

/**
 * Determines if the organization has opted into *any* level of AI features (schema or schema_and_log or schema_and_log_and_data).
 * This is primarily for backward compatibility.
 * @returns boolean (true if opted into schema or schema_and_log or schema_and_log_and_data, false otherwise)
 */
export function useOrgOptedIntoAi(): boolean {
  const { aiOptInLevel } = useOrgAiOptInLevel()
  return !IS_PLATFORM || aiOptInLevel !== 'disabled'
}

/**
 * Determines the organization's specific AI opt-in level and whether schema metadata should be included.
 * @returns Object with aiOptInLevel and includeSchemaMetadata
 */
export function useOrgAiOptInLevel(): {
  aiOptInLevel: AiOptInLevel
  includeSchemaMetadata: boolean
} {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  // [Joshen] Default to disabled until migration to clean up existing opt in tags are completed
  // Once toggled on, then we can default to their set opt in level and clean up feature flag
  const optInTags = selectedOrganization?.opt_in_tags
  const level = getAiOptInLevel(optInTags)
  const isOptedIntoAI = level !== 'disabled'

  // [Joshen] For CLI / self-host, we'd default to 'schema' as opt in level
  const aiOptInLevel = !IS_PLATFORM ? 'schema' : isOptedIntoAI ? level : 'disabled'
  const includeSchemaMetadata = !IS_PLATFORM || aiOptInLevel !== 'disabled'

  return { aiOptInLevel, includeSchemaMetadata }
}
