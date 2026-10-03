import { FeatureFlagProvider, getFlags, useParams } from 'common'
import { useCallback, type ComponentProps } from 'react'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM, useDefaultProvider } from '@/lib/constants'

export const StudioFeatureFlagProvider = ({
  children,
  ...props
}: ComponentProps<typeof FeatureFlagProvider>) => {
  const { ref: projectRef } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })
  const cloudProvider = useDefaultProvider()

  const getConfigCatFlags = useCallback(
    (userEmail?: string) => {
      const customAttributes: Record<string, string> = {}
      if (cloudProvider) customAttributes.cloud_provider = cloudProvider
      if (selectedOrganization?.plan?.id) customAttributes.plan = selectedOrganization.plan.id
      if (projectRef) customAttributes.project_ref = projectRef
      return getFlags(userEmail, customAttributes)
    },
    [cloudProvider, selectedOrganization?.plan?.id, projectRef]
  )

  return (
    <FeatureFlagProvider
      {...props}
      getConfigCatFlags={getConfigCatFlags}
      organizationSlug={selectedOrganization?.slug ?? undefined}
    >
      {children}
    </FeatureFlagProvider>
  )
}
