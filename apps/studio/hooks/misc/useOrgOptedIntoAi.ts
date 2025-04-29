import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'

export type AiOptInLevel = 'disabled' | 'schema' | 'schema_and_data'

/**
 * Determines the organization's AI opt-in level based on opt_in_tags and HIPAA status.
 * @returns AiOptInLevel ('disabled', 'schema', or 'schema_and_data')
 */
export function useOrgOptedIntoAi(): AiOptInLevel {
  const selectedOrganization = useSelectedOrganization()
  const disallowHipaa = useDisallowHipaa()
  const optInTags = selectedOrganization?.opt_in_tags ?? []

  const hasAiSqlTag = optInTags.includes(OPT_IN_TAGS.AI_SQL)
  const hasAiDataTag = optInTags.includes(OPT_IN_TAGS.AI_DATA)

  let level: AiOptInLevel

  if (hasAiSqlTag && hasAiDataTag) {
    level = 'schema_and_data'
  } else if (hasAiSqlTag) {
    level = 'schema'
  } else {
    level = 'disabled'
  }

  // If HIPAA is enabled, override the level to 'disabled'
  const isHipaaEnabled = !disallowHipaa(true) // disallowHipaa(true) returns false if HIPAA is active
  if (isHipaaEnabled) {
    return 'disabled'
  }

  return level
}
