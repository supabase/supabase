import { z } from 'zod'

import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, OPT_IN_TAGS } from 'lib/constants'

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
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags ?? []

  const level = getAiOptInLevel(optInTags)

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(level !== 'disabled') || !IS_PLATFORM
}

/**
 * Determines the organization's specific AI opt-in level and whether schema metadata should be included.
 * @returns Object with aiOptInLevel and includeSchemaMetadata
 */
export function useOrgAiOptInLevel(): {
  aiOptInLevel: AiOptInLevel
  includeSchemaMetadata: boolean
  isHipaaProjectDisallowed: boolean
} {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags

  const level = getAiOptInLevel(optInTags)
  const isOptedIntoAI = level !== 'disabled'

  const disallowHipaa = useDisallowHipaa()
  // isAllowedAI considers if the project is HIPAA or not too
  const isAllowedAI = disallowHipaa(isOptedIntoAI)

  /* if we are in a project context and this has been called,
   * ensure that we aren't letting HIPAA projects activate AI
   * returns level if optedIntoAI and no project selected
   * returns level if optedIntoAI and we are in a project and not HIPAA project
   * returns 'disabled' if opted out of AI
   * returns 'disabled if optedIntoAI and we are in a HIPAA project
   * default to 'schema' if not hosted
   */

  const aiOptInLevel = !IS_PLATFORM
    ? 'schema'
    : (isOptedIntoAI && !selectedProject) || (isOptedIntoAI && isAllowedAI)
      ? level
      : 'disabled'

  const includeSchemaMetadata =
    isAllowedAI &&
    (aiOptInLevel === 'schema' ||
      aiOptInLevel === 'schema_and_log' ||
      aiOptInLevel === 'schema_and_log_and_data' ||
      !IS_PLATFORM)

  return {
    aiOptInLevel,
    includeSchemaMetadata,
    isHipaaProjectDisallowed: isAllowedAI,
  }
}

export function useOrgOptedIntoAiAndHippaProject() {
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags
  const isOptedIntoAI = optInTags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const disallowHipaa = useDisallowHipaa()
  return { isOptedInToAI: isOptedIntoAI, isHipaaProjectDisallowed: disallowHipaa(isOptedIntoAI) }
}
