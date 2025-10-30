import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { useIsSecurityNotificationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Switch,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { TEMPLATES_SCHEMAS } from '../AuthTemplatesValidation'
import EmailRateLimitsAlert from '../EmailRateLimitsAlert'
import { slugifyTitle } from './EmailTemplates.utils'
import { TemplateEditor } from './TemplateEditor'

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
  const isSecurityNotificationsEnabled = useIsSecurityNotificationsEnabled()
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation({
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
    <ScaffoldSection isFullWidth className="!pt-0">
      {isError && (
        <AlertError
          className="mt-12"
          error={authConfigError}
          subject="Failed to retrieve auth configuration"
        />
      )}
      {isLoading && (
        <div className="w-[854px] mt-12">
          <GenericSkeletonLoader />
        </div>
      )}
      {isSuccess && (
        <div className="my-12">
          {builtInSMTP ? (
            <div className="mb-12">
              <EmailRateLimitsAlert />
            </div>
          ) : null}
          {isSecurityNotificationsEnabled ? (
            <div className="space-y-12">
              <div>
                <ScaffoldSectionTitle className="mb-4">Authentication</ScaffoldSectionTitle>
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

                          <div className="flex items-center gap-4 group">
                            <ChevronRight
                              size={16}
                              className="text-foreground-muted group-hover:text-foreground transition-colors"
                            />
                          </div>
                        </Link>
                      </CardContent>
                    )
                  })}
                </Card>
              </div>

              <div>
                <ScaffoldSectionTitle className="mb-4">Security</ScaffoldSectionTitle>
                <Form_Shadcn_ {...notificationsForm}>
                  <form onSubmit={notificationsForm.handleSubmit(onSubmit)} className="space-y-4">
                    <Card>
                      {TEMPLATES_SCHEMAS.filter(
                        (t) => t.misc?.emailTemplateType === 'security'
                      ).map((template) => {
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

                            <div className="flex items-center gap-4 group h-full pl-2">
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
                                <ChevronRight
                                  size={16}
                                  className="text-foreground-muted hover:text-foreground transition-colors"
                                />
                              </Link>
                            </div>
                          </CardContent>
                        )
                      })}
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
              </div>
            </div>
          ) : (
            <Card>
              <Tabs_Shadcn_ defaultValue={slugifyTitle(TEMPLATES_SCHEMAS[0].title)}>
                <TabsList_Shadcn_ className="pt-2 px-6 gap-5 mb-0 overflow-x-scroll no-scrollbar mb-4">
                  {TEMPLATES_SCHEMAS.filter(
                    (t) => t.misc?.emailTemplateType === 'authentication'
                  ).map((template) => (
                    <TabsTrigger_Shadcn_
                      key={`${template.id}`}
                      value={slugifyTitle(template.title)}
                    >
                      {template.title}
                    </TabsTrigger_Shadcn_>
                  ))}
                </TabsList_Shadcn_>
                {TEMPLATES_SCHEMAS.filter(
                  (t) => t.misc?.emailTemplateType === 'authentication'
                ).map((template) => {
                  const panelId = slugifyTitle(template.title)
                  return (
                    <TabsContent_Shadcn_ key={panelId} value={panelId} className="mt-0">
                      <TemplateEditor key={template.title} template={template} />
                    </TabsContent_Shadcn_>
                  )
                })}
              </Tabs_Shadcn_>
            </Card>
          )}
        </div>
      )}
    </ScaffoldSection>
  )
}
