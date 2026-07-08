import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import * as z from 'zod'

import { urlRegex } from '../Auth.constants'
import { AUTH_TEMPLATE_RESET_TYPES } from '../EmailTemplates/EmailTemplates.constants'
import { isBeforeFreeTierTemplateBlockCutoff } from '../EmailTemplates/EmailTemplates.utils'
import { SmtpDisableConfirmationDialog } from './SmtpDisableConfirmationDialog'
import { defaultDisabledSmtpFormValues } from './SmtpForm.constants'
import { generateFormValues, isSmtpEnabled } from './SmtpForm.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAuthTemplateResetMutation } from '@/data/auth/auth-template-reset-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const smtpEnabledSchema = z.object({
  ENABLE_SMTP: z.literal(true),
  SMTP_ADMIN_EMAIL: z
    .string()
    .trim()
    .min(1, 'Sender email address is required')
    .email('Must be a valid email'),
  SMTP_SENDER_NAME: z.string().trim().min(1, 'Sender name is required'),
  SMTP_HOST: z
    .string()
    .trim()
    .min(1, 'Host URL is required')
    .regex(urlRegex({ excludeSimpleDomains: false }), 'Must be a valid URL or IP address'),
  SMTP_PORT: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce
      .number({
        required_error: 'Port number is required',
        invalid_type_error: 'Port number is required',
      })
      .min(1, 'Must be a valid port number more than 0')
      .max(65535, 'Must be a valid port number no more than 65535')
  ),
  SMTP_MAX_FREQUENCY: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce
      .number({
        required_error: 'Rate limit is required',
        invalid_type_error: 'Rate limit is required',
      })
      .min(1, 'Must be more than 0')
      .max(32767, 'Must not be more than 32,767 an hour')
  ),
  SMTP_USER: z.string().trim().min(1, 'SMTP Username is required'),
  SMTP_PASS: z.string().trim().optional(),
})

const smtpDisabledSchema = z.object({
  ENABLE_SMTP: z.literal(false),
  SMTP_ADMIN_EMAIL: z.string().optional(),
  SMTP_SENDER_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce.number().optional()
  ),
  SMTP_MAX_FREQUENCY: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.coerce.number().optional()
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
})

const smtpSchema = z.discriminatedUnion('ENABLE_SMTP', [smtpEnabledSchema, smtpDisabledSchema])

type SmtpFormValues = z.infer<typeof smtpSchema>

export const SmtpForm = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const { data: selectedProject } = useSelectedProjectQuery()

  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation()
  const { mutateAsync: resetAuthTemplate } = useAuthTemplateResetMutation()

  const [enableSmtp, setEnableSmtp] = useState(false)
  const [showDisableConfirmation, setShowDisableConfirmation] = useState(false)
  const [pendingValues, setPendingValues] = useState<SmtpFormValues | null>(null)

  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const blockEditingOnReset =
    !!selectedProject?.inserted_at &&
    isBeforeFreeTierTemplateBlockCutoff(selectedProject.inserted_at)

  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(
      smtpSchema.superRefine((data, ctx) => {
        const isEnablingSmtp = data.ENABLE_SMTP && !isSmtpEnabled(authConfig)

        if (isEnablingSmtp && !data.SMTP_PASS) {
          ctx.addIssue({
            code: 'custom',
            message: 'SMTP Password is required',
            path: ['SMTP_PASS'],
          })
        }
      })
    ),
    defaultValues: {
      SMTP_ADMIN_EMAIL: '',
      SMTP_SENDER_NAME: '',
      SMTP_HOST: '',
      SMTP_PORT: undefined,
      SMTP_MAX_FREQUENCY: undefined,
      SMTP_USER: '',
      SMTP_PASS: '',
      ENABLE_SMTP: false,
    },
  })

  const { isDirty } = form.formState

  const doUpdate = ({
    values,
    onSuccess,
    onError,
  }: {
    values: SmtpFormValues
    onSuccess?: () => void
    onError?: () => void
  }) => {
    const { ENABLE_SMTP, ...rest } = values
    const basePayload = ENABLE_SMTP ? rest : defaultDisabledSmtpFormValues

    // When enabling SMTP, set RATE_LIMIT_EMAIL_SENT to 30
    // When disabling, backend will handle resetting to default
    const isEnablingSmtp = ENABLE_SMTP && !isSmtpEnabled(authConfig)
    const payload = {
      ...basePayload,
      ...(isEnablingSmtp && { RATE_LIMIT_EMAIL_SENT: 30 }),
    }

    // Format payload: Convert port to string
    if (payload.SMTP_PORT) {
      payload.SMTP_PORT = payload.SMTP_PORT.toString() as any
    }

    // the SMTP_PASS is write-only, it's never shown. If we don't delete it from the payload, it will replace the
    // previously saved value with an empty one
    if (payload.SMTP_PASS === '') {
      delete payload.SMTP_PASS
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload as any },
      {
        onError: (error) => {
          toast.error(`Failed to update settings: ${error.message}`)
          onError?.()
        },
        onSuccess: () => {
          toast.success('Successfully updated settings')
          onSuccess?.()
        },
      }
    )
  }

  const onSubmit: SubmitHandler<SmtpFormValues> = (values) => {
    const isDisablingSmtp = !values.ENABLE_SMTP && isSmtpEnabled(authConfig)

    if (isDisablingSmtp) {
      setPendingValues(values)
      setShowDisableConfirmation(true)
      return
    }

    doUpdate({ values })
  }

  const handleConfirmDisable = (): Promise<void> => {
    if (!pendingValues || !projectRef) return Promise.resolve()

    return new Promise<void>((resolve, reject) => {
      doUpdate({
        values: pendingValues,
        onSuccess: async () => {
          setPendingValues(null)
          try {
            const results = await Promise.allSettled(
              AUTH_TEMPLATE_RESET_TYPES.map((template) =>
                resetAuthTemplate({ projectRef, template })
              )
            )
            if (results.some((r) => r.status === 'rejected')) {
              toast.error('SMTP disabled, but some email templates could not be reset')
            }
          } finally {
            resolve()
          }
        },
        onError: reject,
      })
    })
  }

  // Update form values when auth config is loaded
  useEffect(() => {
    if (authConfig) {
      const formValues = generateFormValues(authConfig)
      form.reset({
        ...formValues,
        ENABLE_SMTP: isSmtpEnabled(authConfig),
      } as SmtpFormValues)
      setEnableSmtp(isSmtpEnabled(authConfig))
    }
  }, [authConfig, form])

  // Update enableSmtp state when the form field changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'ENABLE_SMTP') {
        setEnableSmtp(value.ENABLE_SMTP as boolean)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  if (isError) {
    return (
      <PageSection>
        <PageSectionContent>
          <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (!canReadConfig) {
    return (
      <PageSection>
        <PageSectionContent>
          <NoPermission resourceText="view SMTP settings" />
        </PageSectionContent>
      </PageSection>
    )
  }

  const showEnablingAdmonition = form.formState.isDirty && enableSmtp && !isSmtpEnabled(authConfig)

  return (
    <PageSection>
      <PageSectionContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent>
                <FormField
                  control={form.control}
                  name="ENABLE_SMTP"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Enable custom SMTP"
                      description={
                        <p className="text-sm text-foreground-lighter">
                          Send auth emails through your custom SMTP provider.{' '}
                          <InlineLink href={`/project/${projectRef}/auth/rate-limits`}>
                            Rate limits
                          </InlineLink>{' '}
                          apply.
                        </p>
                      }
                    >
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canUpdateConfig}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              {enableSmtp && (
                <>
                  <CardContent className="py-6">
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-4">
                        <h3 className="text-sm mb-1">Sender details</h3>
                        <p className="text-sm text-foreground-lighter text-balance">
                          Configure the sender information for your emails.
                        </p>
                      </div>
                      <div className="col-span-8 space-y-4">
                        <FormField
                          control={form.control}
                          name="SMTP_ADMIN_EMAIL"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Sender email address"
                              description="The email address the emails are sent from."
                            >
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="noreply@yourdomain.com"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="SMTP_SENDER_NAME"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Sender name"
                              description="Name displayed in the recipient's inbox."
                            >
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Your Name"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardContent className="py-6">
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-4">
                        <h3 className="text-sm mb-1">SMTP provider settings</h3>
                        <p className="text-sm text-foreground-lighter text-balance">
                          Your SMTP credentials will always be encrypted in our database.
                        </p>
                      </div>
                      <div className="col-span-8 space-y-4">
                        <FormField
                          control={form.control}
                          name="SMTP_HOST"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Host"
                              description="Hostname or IP address of your SMTP server."
                            >
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="your.smtp.host.com"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />

                        {form.watch('SMTP_HOST')?.endsWith('.gmail.com') && (
                          <Admonition
                            type="warning"
                            title="Check your SMTP provider"
                            description="It looks like the SMTP provider you entered is designed
                            for sending personal rather than transactional email messages. Email deliverability may
                            be impacted."
                            className="mb-4 bg-warning-200 border-warning-400"
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="SMTP_PORT"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Port number"
                              description={
                                <>
                                  <span className="block">
                                    Port used by your SMTP server. Common ports include 465 and 587.
                                    Avoid using port 25 as it is often blocked by providers to curb
                                    spam.
                                  </span>
                                </>
                              }
                            >
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  placeholder="587"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="SMTP_MAX_FREQUENCY"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Minimum interval per user"
                              description="The minimum time in seconds between emails before another email can be sent to the same user."
                            >
                              <FormControl>
                                <InputGroup>
                                  <FormInputGroupInput
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    disabled={!canUpdateConfig}
                                  />
                                  <InputGroupAddon align="inline-end">
                                    <InputGroupText>seconds</InputGroupText>
                                  </InputGroupAddon>
                                </InputGroup>
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="SMTP_USER"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Username"
                              description="Username for your SMTP server."
                            >
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="SMTP Username"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="SMTP_PASS"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Password"
                              description="Password for your SMTP server. For security reasons, this password cannot be viewed once saved."
                            >
                              <FormControl>
                                <PasswordInput {...field} reveal copy disabled={!canUpdateConfig} />
                              </FormControl>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {showEnablingAdmonition && (
                <Admonition
                  type="default"
                  className="rounded-none border-x-0 border-t-0"
                  description={
                    <>
                      The email rate limit will be increased to 30 emails per hour after enabling
                      custom SMTP. It can be{' '}
                      <InlineLink href={`/project/${projectRef}/auth/rate-limits`}>
                        adjusted further
                      </InlineLink>{' '}
                      at any time.
                    </>
                  }
                />
              )}

              <CardFooter className="justify-end gap-x-2">
                <div className="flex items-center gap-x-2">
                  {isDirty && (
                    <Button
                      variant="default"
                      onClick={() => {
                        form.reset()
                        setEnableSmtp(isSmtpEnabled(authConfig))
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    type="submit"
                    loading={isUpdatingConfig}
                    disabled={!canUpdateConfig || !isDirty}
                  >
                    Save changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </PageSectionContent>
      <SmtpDisableConfirmationDialog
        open={showDisableConfirmation}
        onOpenChange={setShowDisableConfirmation}
        onConfirm={handleConfirmDisable}
        blockEditingOnReset={blockEditingOnReset}
      />
    </PageSection>
  )
}
