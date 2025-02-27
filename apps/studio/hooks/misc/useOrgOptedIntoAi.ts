import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'

/**
 * Checks if the organization has opted into sending anonymous data to OpenAI.
 * Also considers if the organization has the HIPAA addon.
 * @returns boolean (false if either not opted in or has the HIPAA addon)
 */
export function useOrgOptedIntoAi() {
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags
  const isOptedIntoAI = optInTags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(isOptedIntoAI)
}
