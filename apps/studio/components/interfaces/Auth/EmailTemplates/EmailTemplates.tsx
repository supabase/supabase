import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { Admonition } from 'ui-patterns/admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import * as z from 'zod'

import { TEMPLATES_SCHEMAS } from '../AuthTemplatesValidation'
import { slugifyTitle } from './EmailTemplates.utils'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'

const notificationEnabledKeys = TEMPLATES_SCHEMAS.filter(
  (t) => t.misc?.emailTemplateType === 'security'
).map((template) => {
  return `MAILER_NOTIFICATIONS_${template.id?.replace('_NOTIFICATION', '')}_ENABLED`
})

const NotificationsFormSchema = z.object({
  ...notificationEnabledKeys.reduce(
    (acc, key) => {
      acc[key] = z.boolean()
      return acc
    },
    {} as Record<string, z.ZodBoolean>
  ),
})

export const EmailTemplates = () => {
  const { ref: projectRef } = useParams()
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const {
    data: authConfig,
    error: authConfigError,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update settings: ${error?.message}`)
    },
    onSuccess: () => {
      toast.success('Successfully updated settings')
    },
  })

  const builtInSMTP =
    isSuccess &&
    authConfig &&
    (!authConfig.SMTP_HOST || !authConfig.SMTP_USER || !authConfig.SMTP_PASS)

  const defaultValues = notificationEnabledKeys.reduce(
    (acc, key) => {
      acc[key] = authConfig ? Boolean(authConfig[key as keyof typeof authConfig]) : false
      return acc
    },
    {} as Record<string, boolean>
  )

  const notificationsForm = useForm<z.infer<typeof NotificationsFormSchema>>({
    resolver: zodResolver(NotificationsFormSchema),
    defaultValues,
  })

  const onSubmit = (values: any) => {
    if (!projectRef) return console.error('Project ref is required')
    updateAuthConfig({ projectRef: projectRef, config: { ...values } })
  }

  useEffect(() => {
    if (authConfig) {
      notificationsForm.reset(defaultValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authConfig])

  return (
    <>
      {isError && (
        <PageSection>
          <PageSectionContent>
            <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
          </PageSectionContent>
        </PageSection>
      )}
      {isLoading && (
        <PageSection>
          <PageSectionContent>
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      )}
      {isSuccess && (
        <>
          <PageSection>
            {builtInSMTP && (
              <Admonition
                type="warning"
                title="Set up custom SMTP"
                description={
                  <p>
                    You’re using the built-in email service. This service has rate limits and is not
                    meant to be used for production apps.{' '}
                    <InlineLink
                      href={`${DOCS_URL}/guides/platform/going-into-prod#auth-rate-limits`}
                    >
                      Learn more
                    </InlineLink>{' '}
                  </p>
                }
                layout="horizontal"
                className="mb-4"
                actions={
                  <Button asChild type="default">
                    <Link href={`/project/${projectRef}/auth/smtp`}>Set up SMTP</Link>
                  </Button>
                }
              />
            )}
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Authentication</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
              <Card>
                {TEMPLATES_SCHEMAS.filter(
                  (t) => t.misc?.emailTemplateType === 'authentication'
                ).map((template) => {
                  const templateSlug = slugifyTitle(template.title)

                  return (
                    <CardContent key={`${template.id}`} className="p-0">
                      <Link
                        href={`/project/${projectRef}/auth/templates/${templateSlug}`}
                        className="flex items-center justify-between hover:bg-surface-200 transition-colors py-4 px-6 w-full h-full"
                      >
                        <div className="flex flex-col">
                          <h3 className="text-sm text-foreground">{template.title}</h3>
                          {template.purpose && (
                            <p className="text-sm text-foreground-lighter">{template.purpose}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <ChevronRight size={16} className="text-foreground-muted" />
                        </div>
                      </Link>
                    </CardContent>
                  )
                })}
              </Card>
            </PageSectionContent>
          </PageSection>

          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Security</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
              <Form_Shadcn_ {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onSubmit)} className="space-y-4">
                  <Card>
                    {TEMPLATES_SCHEMAS.filter((t) => t.misc?.emailTemplateType === 'security').map(
                      (template) => {
                        const templateSlug = slugifyTitle(template.title)
                        const templateEnabledKey =
                          `MAILER_NOTIFICATIONS_${template.id?.replace('_NOTIFICATION', '')}_ENABLED` as keyof typeof authConfig

                        return (
                          <CardContent
                            key={`${template.id}`}
                            className="p-0 flex items-center justify-between hover:bg-surface-200 transition-colors w-full h-full"
                          >
                            <Link
                              href={`/project/${projectRef}/auth/templates/${templateSlug}`}
                              className="flex flex-col flex-1 py-4 px-6"
                            >
                              <h3 className="text-sm text-foreground">{template.title}</h3>
                              {template.purpose && (
                                <p className="text-sm text-foreground-lighter">
                                  {template.purpose}
                                </p>
                              )}
                            </Link>

                            <div className="flex items-center gap-4 h-full pl-2 relative">
                              <FormField_Shadcn_
                                control={notificationsForm.control}
                                name={templateEnabledKey}
                                render={({ field }) => (
                                  <FormControl_Shadcn_>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={!canUpdateConfig}
                                    />
                                  </FormControl_Shadcn_>
                                )}
                              />

                              <Link
                                href={`/project/${projectRef}/auth/templates/${templateSlug}`}
                                className="py-6 pr-6"
                              >
                                <ChevronRight size={16} className="text-foreground-muted" />
                              </Link>
                            </div>
                          </CardContent>
                        )
                      }
                    )}
                    <CardFooter className="justify-end space-x-2">
                      {notificationsForm.formState.isDirty && (
                        <Button type="default" onClick={() => notificationsForm.reset()}>
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="primary"
                        htmlType="submit"
                        disabled={
                          !canUpdateConfig ||
                          isUpdatingConfig ||
                          !notificationsForm.formState.isDirty
                        }
                        loading={isUpdatingConfig}
                      >
                        Save changes
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form_Shadcn_>
            </PageSectionContent>
          </PageSection>
        </>
      )}
    </>
  )
}
