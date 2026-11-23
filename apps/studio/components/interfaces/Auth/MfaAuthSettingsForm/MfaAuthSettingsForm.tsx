import { useParams } from 'common'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { EnhancedMfaSecurityForm } from './EnhancedMfaSecurityForm'
import { PhoneMfaForm } from './PhoneMfaForm'
import { TotpMfaForm } from './TotpMfaForm'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

export const MfaAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()
  const isBranch = project?.parentRef !== project?.ref

  const { can: canReadConfig } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_WRITE
  )

  const { hasAccess: hasAccessToMFAEntitlement, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('auth.mfa_phone')
  const hasAccessToMFA = !IS_PLATFORM || hasAccessToMFAEntitlement
  const promptProPlanUpgrade = IS_PLATFORM && !hasAccessToMFAEntitlement

  const {
    hasAccess: hasAccessToEnhanceSecurityEntitlement,
    isLoading: isLoadingEntitlementEnhanceSecurity,
  } = useCheckEntitlements('auth.mfa_enhanced_security')
  const hasAccessToEnhanceSecurity = !IS_PLATFORM || hasAccessToEnhanceSecurityEntitlement
  const promptEnhancedSecurityUpgrade = IS_PLATFORM && !hasAccessToEnhanceSecurityEntitlement

  if (isError) {
    return (
      <PageSection>
        <PageSectionContent>
          <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (!canReadConfig) {
    return (
      <PageSection>
        <PageSectionContent>
          <NoPermission resourceText="view auth configuration settings" />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (
    isLoading ||
    isLoadingProject ||
    isLoadingEntitlement ||
    isLoadingEntitlementEnhanceSecurity ||
    !authConfig
  ) {
    return (
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <>
      <TotpMfaForm authConfig={authConfig} canUpdateConfig={canUpdateConfig} />
      <PhoneMfaForm
        authConfig={authConfig}
        canUpdateConfig={canUpdateConfig}
        hasAccessToMFA={hasAccessToMFA}
        promptProPlanUpgrade={promptProPlanUpgrade}
        isBranch={isBranch}
      />
      <EnhancedMfaSecurityForm
        authConfig={authConfig}
        canUpdateConfig={canUpdateConfig}
        hasAccessToEnhanceSecurity={hasAccessToEnhanceSecurity}
        promptEnhancedSecurityUpgrade={promptEnhancedSecurityUpgrade}
      />
    </>
  )
}
