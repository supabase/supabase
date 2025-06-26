import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useDisallowHipaa } from 'hooks/misc/useDisallowHipaa'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { OPT_IN_TAGS } from 'lib/constants'

/**
 * Checks if the organization has opted into sending anonymous data to OpenAI.
 * Also considers if the organization has the HIPAA addon.
 * @returns boolean (false if either not opted in or has the HIPAA addon)
 */
export function useOrgOptedIntoAi() {
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const optInTags = selectedOrganization?.opt_in_tags
  const isOptedIntoAI = optInTags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const disallowHipaa = useDisallowHipaa()
  /* if we are in a project context and this has been called,
   * ensure that we aren't letting HIPAA projects activate AI
   * returns true if optedIntoAI and no project selected
   * returns true if optedIntoAI and we are in a project and not HIPAA project
   * returns false if opted out of AI
   * returns false if optedIntoAI and we are in a HIPAA project
   */
  return isOptedIntoAI && (!selectedProject || disallowHipaa(isOptedIntoAI))
}

export function useOrgOptedIntoAiAndHippaProject() {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const optInTags = selectedOrganization?.opt_in_tags
  const isOptedIntoAI = optInTags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: selectedProject?.ref })
  const isProjectSensitive = !!projectSettings?.is_sensitive

  const preventProjectFromUsingAI = hasHipaaAddon && isProjectSensitive

  return { isOptedInToAI: isOptedIntoAI, isHipaaProjectDisallowed: preventProjectFromUsingAI }
}
