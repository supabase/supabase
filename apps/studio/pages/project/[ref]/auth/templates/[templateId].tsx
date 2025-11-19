import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { useIsSecurityNotificationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { TEMPLATES_SCHEMAS } from 'components/interfaces/Auth/AuthTemplatesValidation'
import { slugifyTitle } from 'components/interfaces/Auth/EmailTemplates/EmailTemplates.utils'
import { TemplateEditor } from 'components/interfaces/Auth/EmailTemplates/TemplateEditor'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Switch,
} from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const TemplatePage: NextPageWithLayout = () => {
  return <RedirectToTemplates />
}

const RedirectToTemplates = () => {
  const router = useRouter()
  const { templateId, ref } = router.query
  const { ref: projectRef } = useParams()
  const isSecurityNotificationsEnabled = useIsSecurityNotificationsEnabled()

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { data: authConfig, isLoading: isLoadingConfig } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update settings: ${error?.message}`)
    },
    onSuccess: () => {
      toast.success('Successfully updated settings')
    },
  })

  // Find template whose slug matches the URL slug
  const template =
    templateId && typeof templateId === 'string'
      ? TEMPLATES_SCHEMAS.find((template) => slugifyTitle(template.title) === templateId)
      : null

  // Convert templateId slug to one lowercase word to match docs anchor tag
  const templateIdForDocs =
    typeof templateId === 'string' ? templateId.replace(/-/g, '').toLowerCase() : ''

  // Determine if this is a security notification template
  const isSecurityTemplate = template?.misc?.emailTemplateType === 'security'

  // Get the enabled key for security templates
  const templateEnabledKey = isSecurityTemplate
    ? (`MAILER_NOTIFICATIONS_${template.id?.replace('_NOTIFICATION', '')}_ENABLED` as string)
    : null

  const showConfigurationSection = isSecurityTemplate && templateEnabledKey

  // Create form schema for security templates
  const TemplateFormSchema = templateEnabledKey
    ? z.object({
        [templateEnabledKey]: z.boolean(),
      })
    : z.object({})

  const defaultValues = templateEnabledKey
    ? {
        [templateEnabledKey]: authConfig
          ? Boolean(authConfig[templateEnabledKey as keyof typeof authConfig])
          : false,
      }
    : {}

  const templateForm = useForm<z.infer<typeof TemplateFormSchema>>({
    resolver: zodResolver(TemplateFormSchema),
    defaultValues,
  })

  const onSubmit = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    updateAuthConfig({ projectRef: projectRef, config: { ...values } })
  }

  useEffect(() => {
    if (isPermissionsLoaded && !isSecurityNotificationsEnabled) {
      router.replace(`/project/${ref}/auth/templates/`)
    }
  }, [isPermissionsLoaded, isSecurityNotificationsEnabled, ref, router])

  useEffect(() => {
    if (authConfig && templateEnabledKey) {
      templateForm.reset({
        [templateEnabledKey]: Boolean(authConfig[templateEnabledKey as keyof typeof authConfig]),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authConfig, templateEnabledKey])

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
          href={`${DOCS_URL}/guides/local-development/customizing-email-templates#${isSecurityTemplate ? 'security' : 'auth'}emailtemplate${templateIdForDocs}`}
        />,
      ]}
    >
      <ScaffoldContainer bottomPadding>
        {!isPermissionsLoaded || isLoadingConfig ? (
          <ScaffoldSection isFullWidth>
            <GenericSkeletonLoader />
          </ScaffoldSection>
        ) : (
          <>
            {showConfigurationSection && (
              <ScaffoldSection isFullWidth>
                <ScaffoldSectionTitle className="mb-4">Configuration</ScaffoldSectionTitle>
                <Form_Shadcn_ {...templateForm}>
                  <form onSubmit={templateForm.handleSubmit(onSubmit)} className="space-y-4">
                    <Card>
                      <CardContent>
                        <FormField_Shadcn_
                          control={templateForm.control}
                          name={templateEnabledKey as keyof z.infer<typeof TemplateFormSchema>}
                          render={({ field }) => (
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Enable notification"
                              description="Send this email to users when triggered"
                            >
                              <FormControl_Shadcn_>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </CardContent>
                      <CardFooter className="justify-end space-x-2">
                        {templateForm.formState.isDirty && (
                          <Button type="default" onClick={() => templateForm.reset()}>
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="primary"
                          htmlType="submit"
                          disabled={
                            !canUpdateConfig || isUpdatingConfig || !templateForm.formState.isDirty
                          }
                          loading={isUpdatingConfig}
                        >
                          Save changes
                        </Button>
                      </CardFooter>
                    </Card>
                  </form>
                </Form_Shadcn_>
              </ScaffoldSection>
            )}

            <ScaffoldSection isFullWidth>
              {/* Only show title if there is an another section above */}
              {showConfigurationSection && (
                <ScaffoldSectionTitle className="mb-4">Content</ScaffoldSectionTitle>
              )}
              <Card>
                <TemplateEditor template={template} />
              </Card>
            </ScaffoldSection>
          </>
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
