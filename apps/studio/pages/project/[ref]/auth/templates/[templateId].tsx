import { PermissionAction } from '@supabase/shared-types/out/constants'

import { TEMPLATES_SCHEMAS } from 'components/interfaces/Auth/AuthTemplatesValidation'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useRouter } from 'next/router'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns'

const TemplatePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { templateId } = router.query

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  // Convert templateId slug back to template ID for lookup
  const templateIdFromSlug = (slug: string) => {
    const template = TEMPLATES_SCHEMAS.find((template) => {
      const templateSlug = template.title.trim().replace(/\s+/g, '-').toLowerCase()
      return templateSlug === slug
    })
    return template?.id
  }

  const template = TEMPLATES_SCHEMAS.find(
    (template) => template.id === templateIdFromSlug(templateId as string)
  )

  return (
    <ScaffoldContainer bottomPadding>
      {!isPermissionsLoaded ? (
        <ScaffoldSection isFullWidth>
          <GenericSkeletonLoader />
        </ScaffoldSection>
      ) : (
        <ScaffoldSection isFullWidth>
          <div>
            <ScaffoldSectionTitle>{template?.title || 'Email template'}</ScaffoldSectionTitle>
            <ScaffoldSectionDescription>
              {template?.purpose || 'Configure and customize your email template settings.'}
            </ScaffoldSectionDescription>
          </div>
          {/* Template content will go here */}
          <div className="mt-6">
            <p className="text-foreground-light">Template editor will be implemented here.</p>
          </div>
        </ScaffoldSection>
      )}
    </ScaffoldContainer>
  )
}

TemplatePage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default TemplatePage
