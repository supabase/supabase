import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useIsSecurityNotificationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { TEMPLATES_SCHEMAS } from 'components/interfaces/Auth/AuthTemplatesValidation'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns'
import { DocsButton } from 'components/ui/DocsButton'
import { DOCS_URL } from 'lib/constants'
import { Button, Card, CardContent } from 'ui'

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
        <DocsButton key="docs" href={`${DOCS_URL}/reference/javascript/subscribe`} />,
      ]}
    >
      <ScaffoldContainer bottomPadding>
        {!isPermissionsLoaded ? (
          <ScaffoldSection isFullWidth>
            <GenericSkeletonLoader />
          </ScaffoldSection>
        ) : (
          <ScaffoldSection isFullWidth>
            <ScaffoldHeader>
              <ScaffoldSectionTitle>Contents</ScaffoldSectionTitle>
            </ScaffoldHeader>
            {/* Template content will go here */}
            <Card>
              <CardContent>
                <p className="text-foreground-light">Template editor will be implemented here.</p>
              </CardContent>
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
