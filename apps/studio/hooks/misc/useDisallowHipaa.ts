import { useMemo } from 'react'

import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

export function useProjectShouldNotUseAI() {
  const project = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: project?.ref })

  const shouldNotUseAI = useMemo(() => {
    return hasHipaaAddon && !!projectSettings?.is_sensitive
  }, [hasHipaaAddon, projectSettings])

  return shouldNotUseAI
}
