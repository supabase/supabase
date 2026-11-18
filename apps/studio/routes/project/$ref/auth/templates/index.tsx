import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { EmailTemplates } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplates'
import { AuthEmailsLayout } from '@/components/layouts/AuthLayout/AuthEmailsLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export const Route = createFileRoute('/project/$ref/auth/templates/')({
  component: AuthTemplatesIndexRoute,
  // AuthEmailsLayout wraps in <AuthLayout> internally; opt out of the
  // auth.tsx shell wrap to avoid double-wrapping. Sibling
  // templates/$templateId.tsx does NOT use AuthEmailsLayout, so we
  // can't share a templates.tsx sub-shell — each leaf wraps itself.
  staticData: {
    skipAuthLayout: true,
  },
})

function AuthTemplatesIndexRoute() {
  return (
    <AuthEmailsLayout>
      <TemplatesPage />
    </AuthEmailsLayout>
  )
}

function TemplatesPage() {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <PageContainer size="default" className="pb-16">
      {!isPermissionsLoaded ? (
        <PageSection>
          <PageSectionContent>
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      ) : (
        <EmailTemplates />
      )}
    </PageContainer>
  )
}
