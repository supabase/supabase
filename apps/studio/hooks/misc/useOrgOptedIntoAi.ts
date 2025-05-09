import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'

export type AiOptInLevel = 'disabled' | 'schema' | 'schema_and_log' | 'schema_and_log_and_data'

// Exported helper function
export const getAiOptInLevel = (tags: string[] | undefined): AiOptInLevel => {
  const hasSql = tags?.includes(OPT_IN_TAGS.AI_SQL)
  const hasData = tags?.includes(OPT_IN_TAGS.AI_DATA)
  const hasLog = tags?.includes(OPT_IN_TAGS.AI_LOG)

  let level: AiOptInLevel

  if (hasData) {
    level = 'schema_and_log_and_data'
  } else if (hasLog) {
    level = 'schema_and_log'
  } else if (hasSql) {
    level = 'schema'
  } else {
    level = 'disabled'
  }

  return level
}

/**
 * Determines if the organization has opted into *any* level of AI features (schema or schema_and_log or schema_and_log_and_data).
 * This is primarily for backward compatibility.
 * @returns boolean (true if opted into schema or schema_and_log or schema_and_log_and_data, false otherwise)
 */
export function useOrgOptedIntoAi(): boolean {
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags ?? []

  const level = getAiOptInLevel(optInTags)

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(level !== 'disabled')
}

/**
 * Determines the organization's specific AI opt-in level.
 * @returns AiOptInLevel ('disabled', 'schema', 'schema_and_log', or 'schema_and_log_and_data')
 */
export function useOrgAiOptInLevel(): AiOptInLevel {
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags

  // Use the helper function
  const level = getAiOptInLevel(optInTags)

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(level !== 'disabled') ? level : 'disabled'
}
