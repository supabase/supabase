import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { OPT_IN_TAGS } from 'lib/constants'

export function useOrgOptedIntoAi() {
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags
  const isOptedIntoAI = optInTags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const disallowHipaa = useDisallowHipaa()
  return disallowHipaa(isOptedIntoAI)
}
