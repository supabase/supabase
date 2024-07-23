import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import * as z from 'zod'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  WarningIcon,
} from 'ui'
import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'

const RateLimits = () => {
  const formId = 'auth-rate-limits-form'
  const { ref: projectRef } = useParams()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const {
    data: authConfig,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation({
    onSuccess: () => {
      toast.success('Rate limits successfully updated')
    },
    onError: (error) => {
      toast.error(`Failed to update rate limits: ${error.message}`)
    },
  })

  const canUpdateEmailLimit = authConfig?.EXTERNAL_EMAIL_ENABLED && isSmtpEnabled(authConfig)
  const canUpdateSMSRateLimit = authConfig?.EXTERNAL_PHONE_ENABLED && !authConfig?.SMS_AUTOCONFIRM
  const canUpdateAnonymousUsersRateLimit = authConfig?.EXTERNAL_ANONYMOUS_USERS_ENABLED

  const FormSchema = z.object({
    RATE_LIMIT_TOKEN_REFRESH: z.coerce
      .number()
      .min(0, 'Must be not be lower than 0')
      .max(32767, 'Must not be more than 32,767 an 5 minutes'),
    RATE_LIMIT_VERIFY: z.coerce
      .number()
      .min(0, 'Must be not be lower than 0')
      .max(32767, 'Must not be more than 32,767 an 5 minutes'),
    RATE_LIMIT_EMAIL_SENT: z.coerce
      .number()
      .min(0, 'Must be not be lower than 0')
      .max(32767, 'Must not be more than 32,767 an hour'),
    RATE_LIMIT_SMS_SENT: z.coerce
      .number()
      .min(0, 'Must be not be lower than 0')
      .max(32767, 'Must not be more than 32,767 an hour'),
    RATE_LIMIT_ANONYMOUS_USERS: z.coerce
      .number()
      .min(0, 'Must be not be lower than 0')
      .max(32767, 'Must not be more than 32,767 an hour'),
    RATE_LIMIT_OTP: z.coerce
      .number()
      .min(0, 'Must be not be lower than 0')
      .max(32767, 'Must not be more than 32,767 an hour'),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      RATE_LIMIT_TOKEN_REFRESH: 0,
      RATE_LIMIT_VERIFY: 0,
      RATE_LIMIT_EMAIL_SENT: 0,
      RATE_LIMIT_SMS_SENT: 0,
      RATE_LIMIT_OTP: 0,
    },
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')

    const payload: Partial<z.infer<typeof FormSchema>> = {}
    const params = [
      'RATE_LIMIT_TOKEN_REFRESH',
      'RATE_LIMIT_VERIFY',
      'RATE_LIMIT_EMAIL_SENT',
      'RATE_LIMIT_SMS_SENT',
      'RATE_LIMIT_ANONYMOUS_USERS',
      'RATE_LIMIT_OTP',
    ] as (keyof typeof payload)[]
    params.forEach((param) => {
      if (data[param] !== authConfig?.[param]) payload[param] = data[param]
    })

    updateAuthConfig({ projectRef, config: payload }, { onSuccess: () => form.reset(data) })
  }

  useEffect(() => {
    if (isSuccess) {
      form.reset({
        RATE_LIMIT_TOKEN_REFRESH: authConfig.RATE_LIMIT_TOKEN_REFRESH,
        RATE_LIMIT_VERIFY: authConfig.RATE_LIMIT_VERIFY,
        RATE_LIMIT_EMAIL_SENT: authConfig.RATE_LIMIT_EMAIL_SENT,
        RATE_LIMIT_SMS_SENT: authConfig.RATE_LIMIT_SMS_SENT,
        RATE_LIMIT_ANONYMOUS_USERS: authConfig.RATE_LIMIT_ANONYMOUS_USERS,
        RATE_LIMIT_OTP: authConfig.RATE_LIMIT_OTP,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  return (
    <div>
      <FormHeader
        title="Rate Limits"
        description="Safeguard against bursts of incoming traffic to prevent abuse and maximize stability"
        docsUrl="https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention"
      />

      {isError && <AlertError subject="Failed to retrieve auth config rate limits" error={error} />}

      {isLoading && <GenericSkeletonLoader />}

      {isSuccess && (
        <Form_Shadcn_ {...form}>
          <form id={formId} className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormPanel
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isUpdatingConfig}
                    hasChanges={form.formState.isDirty}
                    handleReset={() => form.reset()}
                    disabled={!canUpdateConfig}
                    helper={
                      !canUpdateConfig
                        ? 'You need additional permissions to update authentication settings'
                        : undefined
                    }
                  />
                </div>
              }
            >
              <FormSection
                id="email-sent"
                header={
                  <FormSectionLabel
                    description={
                      <p className="text-foreground-light text-sm">
                        Number of emails that can be sent per hour from your project
                      </p>
                    }
                  >
                    Rate limit for sending emails
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={false}>
                  <FormField_Shadcn_
                    control={form.control}
                    name="RATE_LIMIT_EMAIL_SENT"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            disabled={!canUpdateConfig || !canUpdateEmailLimit}
                            type="number"
                            {...field}
                          />
                        </FormControl_Shadcn_>
                        {!authConfig.EXTERNAL_EMAIL_ENABLED ? (
                          <Alert_Shadcn_>
                            <WarningIcon />
                            <AlertTitle_Shadcn_>
                              Email-based logins are not enabled for your project
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                              <p className="!leading-tight">
                                Enable email-based logins to update this rate limit
                              </p>
                              <Button asChild type="default" className="w-min">
                                <Link href={`/project/${projectRef}/auth/providers`}>
                                  View auth providers
                                </Link>
                              </Button>
                            </AlertDescription_Shadcn_>
                          </Alert_Shadcn_>
                        ) : !isSmtpEnabled(authConfig) ? (
                          <Alert_Shadcn_>
                            <WarningIcon />
                            <AlertTitle_Shadcn_>
                              Custom SMTP provider is required to update this configuration
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                              <p className="!leading-tight">
                                The built-in email service has a fixed rate limit. You will need to
                                set up your own custom SMTP provider to update your email rate limit
                              </p>
                              <Button asChild type="default" className="w-min">
                                <Link href={`/project/${projectRef}/settings/auth`}>
                                  View SMTP settings
                                </Link>
                              </Button>
                            </AlertDescription_Shadcn_>
                          </Alert_Shadcn_>
                        ) : null}
                      </FormItem_Shadcn_>
                    )}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection
                id="sms-sent"
                header={
                  <FormSectionLabel
                    description={
                      <p className="text-foreground-light text-sm">
                        Number of SMS messages that can be sent per hour from your project
                      </p>
                    }
                  >
                    Rate limit for sending SMS messages
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={false}>
                  <FormField_Shadcn_
                    control={form.control}
                    name="RATE_LIMIT_SMS_SENT"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            disabled={!canUpdateConfig || !canUpdateSMSRateLimit}
                            type="number"
                            {...field}
                          />
                        </FormControl_Shadcn_>
                        {!canUpdateSMSRateLimit && (
                          <Alert_Shadcn_>
                            <WarningIcon />
                            <AlertTitle_Shadcn_>
                              Phone-based logins are not enabled for your project
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                              <p className="!leading-tight">
                                Enable phone-based logins to update this rate limit
                              </p>
                              <Button asChild type="default" className="w-min">
                                <Link href={`/project/${projectRef}/auth/providers`}>
                                  View auth providers
                                </Link>
                              </Button>
                            </AlertDescription_Shadcn_>
                          </Alert_Shadcn_>
                        )}
                      </FormItem_Shadcn_>
                    )}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection
                id="token-refresh"
                header={
                  <FormSectionLabel
                    description={
                      <p className="text-foreground-light text-sm">
                        Number of sessions that can be refreshed in a 5 minute interval per IP
                        address.
                      </p>
                    }
                  >
                    Rate limit for token refreshes
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={false}>
                  <FormField_Shadcn_
                    control={form.control}
                    name="RATE_LIMIT_TOKEN_REFRESH"
                    render={({ field }) => (
                      <FormItem_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ type="number" {...field} disabled={!canUpdateConfig} />
                        </FormControl_Shadcn_>
                        {field.value > 0 && (
                          <>
                            <p className="text-foreground-lighter text-sm">
                              This is equivalent to {field.value * 12} requests per hour
                            </p>
                          </>
                        )}
                      </FormItem_Shadcn_>
                    )}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection
                id="verify"
                header={
                  <FormSectionLabel
                    description={
                      <p className="text-foreground-light text-sm">
                        Number of OTP/Magic link verifications that can be made in a 5 minute
                        interval per IP address.
                      </p>
                    }
                  >
                    Rate limit for token verifications
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={false}>
                  <FormField_Shadcn_
                    control={form.control}
                    name="RATE_LIMIT_VERIFY"
                    render={({ field }) => (
                      <FormItem_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ type="number" {...field} disabled={!canUpdateConfig} />
                        </FormControl_Shadcn_>
                        {field.value > 0 && (
                          <p className="text-foreground-lighter text-sm">
                            This is equivalent to {field.value * 12} requests per hour
                          </p>
                        )}
                      </FormItem_Shadcn_>
                    )}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection
                id="anonymous-users"
                header={
                  <FormSectionLabel
                    description={
                      <p className="text-foreground-light text-sm">
                        Number of anonymous sign-ins that can be made per hour per IP address.
                      </p>
                    }
                  >
                    Rate limit for anonymous users
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={false}>
                  <FormField_Shadcn_
                    control={form.control}
                    name="RATE_LIMIT_ANONYMOUS_USERS"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            disabled={!canUpdateConfig || !canUpdateAnonymousUsersRateLimit}
                            type="number"
                            {...field}
                          />
                        </FormControl_Shadcn_>
                        {!canUpdateAnonymousUsersRateLimit && (
                          <Alert_Shadcn_>
                            <WarningIcon />
                            <AlertTitle_Shadcn_>
                              Anonymous logins are not enabled for your project
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                              <p className="!leading-tight">
                                Enable anonymous logins to update this rate limit
                              </p>
                              <Button asChild type="default" className="w-min">
                                <Link href={`/project/${projectRef}/settings/auth`}>
                                  View auth settings
                                </Link>
                              </Button>
                            </AlertDescription_Shadcn_>
                          </Alert_Shadcn_>
                        )}
                      </FormItem_Shadcn_>
                    )}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection
                id="otp"
                header={
                  <FormSectionLabel
                    description={
                      <p className="text-foreground-light text-sm">
                        Number of sign up and sign-in requests that can be made per hour per IP
                        address (excludes anonymous users).
                      </p>
                    }
                  >
                    Rate limit for sign ups and sign ins
                  </FormSectionLabel>
                }
              >
                <FormSectionContent loading={false}>
                  <FormField_Shadcn_
                    control={form.control}
                    name="RATE_LIMIT_OTP"
                    render={({ field }) => (
                      <FormItem_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ type="number" {...field} disabled={!canUpdateConfig} />
                        </FormControl_Shadcn_>
                        {field.value > 0 && (
                          <FormDescription_Shadcn_ className="text-foreground-lighter">
                            This is equivalent to {field.value * 12} requests per hour
                          </FormDescription_Shadcn_>
                        )}
                      </FormItem_Shadcn_>
                    )}
                  />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </form>
        </Form_Shadcn_>
      )}
    </div>
  )
}

export default RateLimits
