import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { SmtpForm } from '@/components/interfaces/Auth/SmtpForm/SmtpForm'
import { AuthEmailsLayout } from '@/components/layouts/AuthLayout/AuthEmailsLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export const Route = createFileRoute('/project/$ref/auth/smtp')({
  component: AuthSmtpRoute,
  // AuthEmailsLayout wraps in <AuthLayout> internally; opt out of the
  // auth.tsx shell wrap to avoid double-wrapping.
  staticData: {
    skipAuthLayout: true,
  },
})

function AuthSmtpRoute() {
  return (
    <AuthEmailsLayout>
      <SmtpPage />
    </AuthEmailsLayout>
  )
}

function SmtpPage() {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <PageContainer size="default">
      {!isPermissionsLoaded ? (
        <PageSection>
          <PageSectionContent>
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      ) : (
        <SmtpForm />
      )}
    </PageContainer>
  )
}
