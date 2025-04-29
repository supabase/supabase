import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'

export type AiOptInLevel = 'disabled' | 'schema' | 'schema_and_data'

/**
 * Determines if the organization has opted into *any* level of AI features (schema or schema_and_data).
 * This is primarily for backward compatibility.
 * @returns boolean (true if opted into schema or schema_and_data, false otherwise)
 */
export function useOrgOptedIntoAi(): boolean {
  const selectedOrganization = useSelectedOrganization()
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

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(level !== 'disabled')
}

/**
 * Determines the organization's specific AI opt-in level.
 * @returns AiOptInLevel ('disabled', 'schema', or 'schema_and_data')
 */
export function useOrgAiOptInLevel(): AiOptInLevel {
  const selectedOrganization = useSelectedOrganization()
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

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(level !== 'disabled') ? level : 'disabled'
}
