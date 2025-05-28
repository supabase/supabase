import { useCallback } from 'react'

import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

export function useDisallowHipaa() {
  const selectedOrganization = useSelectedOrganization()
  const project = useSelectedProject()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)
  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: project?.ref })

  const disallowHipaa = useCallback(
    (allowed: boolean) => {
      return hasHipaaAddon && projectSettings?.is_sensitive ? false : allowed
    },
    [hasHipaaAddon, projectSettings]
  )

  return disallowHipaa
}
