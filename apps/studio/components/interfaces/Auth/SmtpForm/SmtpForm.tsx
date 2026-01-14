import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as yup from 'yup'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  Switch,
  cn,
} from 'ui'
import { Admonition, PageSection, PageSectionContent } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { urlRegex } from '../Auth.constants'
import { defaultDisabledSmtpFormValues } from './SmtpForm.constants'
import { generateFormValues, isSmtpEnabled } from './SmtpForm.utils'

interface SmtpFormValues {
  SMTP_ADMIN_EMAIL?: string
  SMTP_SENDER_NAME?: string
  SMTP_HOST?: string
  SMTP_PORT?: number
  SMTP_MAX_FREQUENCY?: number
  SMTP_USER?: string
  SMTP_PASS?: string
  ENABLE_SMTP: boolean
}

export const SmtpForm = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const [enableSmtp, setEnableSmtp] = useState(false)
  const [hidden, setHidden] = useState(true)

  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const smtpSchema = yup.object({
    SMTP_ADMIN_EMAIL: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema.email('Must be a valid email').required('Sender email address is required'),
      otherwise: (schema) => schema,
    }),
    SMTP_SENDER_NAME: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) => schema.required('Sender name is required'),
      otherwise: (schema) => schema,
    }),
    SMTP_HOST: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema
          .matches(urlRegex({ excludeSimpleDomains: false }), 'Must be a valid URL or IP address')
          .required('Host URL is required.'),
      otherwise: (schema) => schema,
    }),
    SMTP_PORT: yup.number().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema
          .required('Port number is required.')
          .min(1, 'Must be a valid port number more than 0')
          .max(65535, 'Must be a valid port number no more than 65535'),
      otherwise: (schema) => schema,
    }),
    SMTP_MAX_FREQUENCY: yup.number().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema
          .required('Rate limit is required.')
          .min(1, 'Must be more than 0')
          .max(32767, 'Must not be more than 32,767 an hour'),
      otherwise: (schema) => schema,
    }),
    SMTP_USER: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) => schema.required('SMTP Username is required'),
      otherwise: (schema) => schema,
    }),
    SMTP_PASS: yup.string(),
    ENABLE_SMTP: yup.boolean().required(),
  })

  const form = useForm<SmtpFormValues>({
    resolver: yupResolver(smtpSchema),
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

  // Update form values when auth config is loaded
  useEffect(() => {
    if (authConfig) {
      const formValues = generateFormValues(authConfig)
      // Convert SMTP_PORT from string to number if it exists
      if (formValues.SMTP_PORT) {
        formValues.SMTP_PORT = Number(formValues.SMTP_PORT) as any
      }
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

  const onSubmit = (values: SmtpFormValues) => {
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
        },
        onSuccess: () => {
          setHidden(true)
          toast.success('Successfully updated settings')
        },
      }
    )
  }

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

  return (
    <PageSection>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="ENABLE_SMTP"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Enable custom SMTP"
                      description={
                        <p className="max-w-full prose text-sm text-foreground-lighter">
                          Emails will be sent using your custom SMTP provider. Email rate limits can
                          be adjusted{' '}
                          <InlineLink href={`/project/${projectRef}/auth/rate-limits`}>
                            here
                          </InlineLink>
                          .
                        </p>
                      }
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

                {enableSmtp && !isSmtpEnabled(form.getValues() as any) && (
                  <Admonition
                    type="warning"
                    title="All fields must be filled"
                    description="Each of the fields below must be filled before custom SMTP can be enabled."
                    className="bg-warning-200 border-warning-400 mt-4"
                  />
                )}
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
                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_ADMIN_EMAIL"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Sender email address"
                              description="The email address the emails are sent from."
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="noreply@yourdomain.com"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_SENDER_NAME"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Sender name"
                              description="Name displayed in the recipient's inbox."
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="Your Name"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
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
                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_HOST"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Host"
                              description="Hostname or IP address of your SMTP server."
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="your.smtp.host.com"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
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

                        <FormField_Shadcn_
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
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  type="number"
                                  value={field.value}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  placeholder="587"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_MAX_FREQUENCY"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Minimum interval per user"
                              description="The minimum time in seconds between emails before another email can be sent to the same user."
                            >
                              <FormControl_Shadcn_>
                                <PrePostTab postTab="seconds">
                                  <Input_Shadcn_
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    disabled={!canUpdateConfig}
                                  />
                                </PrePostTab>
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_USER"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Username"
                              description="Username for your SMTP server."
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="SMTP Username"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_PASS"
                          render={({ field }) => (
                            <FormItemLayout
                              label="Password"
                              description="Password for your SMTP server. For security reasons, this password cannot be viewed once saved."
                            >
                              <FormControl_Shadcn_>
                                <PrePostTab
                                  postTab={
                                    <Button
                                      type="text"
                                      className="p-0"
                                      onClick={() => setHidden(!hidden)}
                                      icon={hidden ? <Eye /> : <EyeOff />}
                                    />
                                  }
                                >
                                  <Input_Shadcn_
                                    {...field}
                                    type={hidden ? 'password' : 'text'}
                                    placeholder={
                                      authConfig?.SMTP_PASS === null ? 'SMTP Password' : '••••••••'
                                    }
                                    disabled={!canUpdateConfig}
                                  />
                                </PrePostTab>
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              <CardFooter
                className={cn(
                  form.formState.isDirty ? 'justify-between' : 'justify-end',
                  'gap-x-2'
                )}
              >
                {form.formState.isDirty && (
                  <p className="text-sm text-foreground-light">
                    {enableSmtp ? (
                      <>
                        Rate limit for sending emails will be increased to 30 and{' '}
                        <InlineLink href={`/project/${projectRef}/auth/rate-limits`}>
                          can be adjusted
                        </InlineLink>{' '}
                        after enabling custom SMTP
                      </>
                    ) : (
                      'Rate limit for sending emails will be reduced to 2 after disabling custom SMTP'
                    )}
                  </p>
                )}
                <div className="flex items-center gap-x-2">
                  {form.formState.isDirty && (
                    <Button
                      type="default"
                      onClick={() => {
                        form.reset()
                        setEnableSmtp(isSmtpEnabled(authConfig))
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdatingConfig}
                    disabled={!canUpdateConfig || !form.formState.isDirty}
                  >
                    Save changes
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
