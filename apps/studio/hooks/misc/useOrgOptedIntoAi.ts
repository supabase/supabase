import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'

export type AiOptInLevel = 'disabled' | 'schema' | 'schema_and_data'

// Exported helper function
export const getAiOptInLevel = (tags: string[] | undefined): AiOptInLevel => {
  const hasSql = tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const hasData = tags?.includes(OPT_IN_TAGS.AI_DATA ?? 'AI_DATA') // Ensure AI_DATA exists or handle potential undefined

  if (hasSql && hasData) {
    return 'schema_and_data'
  } else if (hasSql) {
    return 'schema'
  } else {
    return 'disabled'
  }
}

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
  const optInTags = selectedOrganization?.opt_in_tags

  // Use the helper function
  const level = getAiOptInLevel(optInTags)

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(level !== 'disabled') ? level : 'disabled'
}
