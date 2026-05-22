import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'

import { TEMPLATES_SCHEMAS } from '@/components/interfaces/Auth/EmailTemplates/AuthTemplatesValidation'
import { slugifyTitle } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplates.utils'
import { TemplateEditor } from '@/components/interfaces/Auth/EmailTemplates/TemplateEditor'
import { AuthEmailTemplateLayout } from '@/components/layouts/AuthLayout/AuthEmailTemplateLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const TemplatePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { templateId, ref } = router.query

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  const template =
    templateId && typeof templateId === 'string'
      ? TEMPLATES_SCHEMAS.find((item) => slugifyTitle(item.title) === templateId)
      : null

  const templateIdForDocs =
    typeof templateId === 'string' ? templateId.replace(/-/g, '').toLowerCase() : ''

  const isSecurityTemplate = template?.misc?.emailTemplateType === 'security'

  const docsHref = template
    ? `${DOCS_URL}/guides/local-development/customizing-email-templates#${isSecurityTemplate ? 'security' : 'auth'}emailtemplate${templateIdForDocs}`
    : `${DOCS_URL}/guides/local-development/customizing-email-templates`

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  if (!templateId) {
    return null
  }

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
    <AuthEmailTemplateLayout templateTitle={template.title} docsHref={docsHref} template={template}>
      {!isPermissionsLoaded ? (
        <div className="flex h-full items-center justify-center">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <TemplateEditor template={template} />
      )}
    </AuthEmailTemplateLayout>
  )
}

TemplatePage.getLayout = (page) => <DefaultLayout>{page}</DefaultLayout>

export default TemplatePage
