import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useIsSecurityNotificationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { TEMPLATES_SCHEMAS } from 'components/interfaces/Auth/AuthTemplatesValidation'
import TemplateEditor from 'components/interfaces/Auth/EmailTemplates/TemplateEditor'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'
import { Card, CardContent } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

const TemplatePage: NextPageWithLayout = () => {
  return <RedirectToTemplates />
}

const RedirectToTemplates = () => {
  const router = useRouter()
  const { templateId, ref } = router.query
  const isSecurityNotificationsEnabled = useIsSecurityNotificationsEnabled()

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  useEffect(() => {
    if (isPermissionsLoaded && !isSecurityNotificationsEnabled) {
      router.replace(`/project/${ref}/auth/templates/`)
    }
  }, [isPermissionsLoaded, isSecurityNotificationsEnabled, ref, router])

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  if (!isSecurityNotificationsEnabled) {
    return null
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

  // Convert templateId slug to one lowercase word to match docs anchor tag
  const templateIdForDocs = templateId.replace(/-/g, '').toLowerCase()

  return (
    <PageLayout
      title={template?.title || 'Email template'}
      subtitle={template?.purpose || 'Configure and customize email templates.'}
      breadcrumbs={[
        {
          label: 'Emails',
          href: `/project/${ref}/auth/templates`,
        },
      ]}
      secondaryActions={[
        <DocsButton
          key="docs"
          href={`${DOCS_URL}/guides/local-development/customizing-email-templates#authemailtemplate${templateIdForDocs}`}
        />,
      ]}
    >
      <ScaffoldContainer bottomPadding>
        {!isPermissionsLoaded ? (
          <ScaffoldSection isFullWidth>
            <GenericSkeletonLoader />
          </ScaffoldSection>
        ) : (
          <ScaffoldSection isFullWidth>
            <Card>
              <TemplateEditor template={template} />
            </Card>
          </ScaffoldSection>
        )}
      </ScaffoldContainer>
    </PageLayout>
  )
}

TemplatePage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default TemplatePage
