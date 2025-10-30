import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useIsSecurityNotificationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { TEMPLATES_SCHEMAS } from 'components/interfaces/Auth/AuthTemplatesValidation'
import { slugifyTitle } from 'components/interfaces/Auth/EmailTemplates/EmailTemplates.utils'
import { TemplateEditor } from 'components/interfaces/Auth/EmailTemplates/TemplateEditor'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button, Card } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'

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

  // Find template whose slug matches the URL slug
  const template =
    templateId && typeof templateId === 'string'
      ? TEMPLATES_SCHEMAS.find((template) => slugifyTitle(template.title) === templateId)
      : null

  // Convert templateId slug to one lowercase word to match docs anchor tag
  const templateIdForDocs =
    typeof templateId === 'string' ? templateId.replace(/-/g, '').toLowerCase() : ''

  useEffect(() => {
    if (isPermissionsLoaded && !isSecurityNotificationsEnabled) {
      router.replace(`/project/${ref}/auth/templates/`)
    }
  }, [isPermissionsLoaded, isSecurityNotificationsEnabled, ref, router])

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  if (!isSecurityNotificationsEnabled || !templateId) {
    return null
  }

  // Show error if templateId is invalid or template is not found
  if (!template) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Admonition
          className="max-w-md"
          type="default"
          title="Unable to find template"
          description={`${templateId ? `The template "${templateId}"` : 'This template'} doesn’t seem to exist.`}
        >
          <Button asChild type="default" className="mt-2">
            <Link href={`/project/${ref}/auth/templates`}>Head back</Link>
          </Button>
        </Admonition>
      </div>
    )
  }

  return (
    <PageLayout
      title={template.title}
      subtitle={template.purpose || 'Configure and customize email templates.'}
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
