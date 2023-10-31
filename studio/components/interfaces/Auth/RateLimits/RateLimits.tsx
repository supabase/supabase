import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  IconAlertCircle,
  Input_Shadcn_,
} from 'ui'
import * as z from 'zod'

import AlertError from 'components/ui/AlertError'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks'
import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'
import toast from 'react-hot-toast'

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
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      RATE_LIMIT_TOKEN_REFRESH: 0,
      RATE_LIMIT_VERIFY: 0,
      RATE_LIMIT_EMAIL_SENT: 0,
      RATE_LIMIT_SMS_SENT: 0,
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
                      <FormItem_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ disabled={!canUpdateEmailLimit} type="number" {...field} />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                        {!canUpdateEmailLimit && (
                          <Alert_Shadcn_>
                            <IconAlertCircle strokeWidth={1.5} />
                            <AlertTitle_Shadcn_>
                              {!authConfig.EXTERNAL_EMAIL_ENABLED &&
                                'Enable email-based logins to update this configuration'}
                              {!isSmtpEnabled(authConfig) &&
                                'Custom SMTP provider is required to update this configuration'}
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_>
                              <p className="!leading-tight">
                                {!authConfig.EXTERNAL_EMAIL_ENABLED &&
                                  'Head over to the providers page to enable email provider before updating your rate limit'}
                                {!isSmtpEnabled(authConfig) &&
                                  'The built-in email service has a fixed rate limit. You will need to set up your own custom SMTP provider to update your email rate limit'}
                              </p>
                              <Button asChild type="default" className="mt-2">
                                <Link
                                  href={
                                    !authConfig.EXTERNAL_EMAIL_ENABLED
                                      ? `/project/${projectRef}/auth/providers`
                                      : `/project/${projectRef}/settings/auth`
                                  }
                                >
                                  {!authConfig.EXTERNAL_EMAIL_ENABLED
                                    ? 'View providers configuration'
                                    : 'View SMTP settings'}
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
                      <FormItem_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            disabled={!canUpdateSMSRateLimit}
                            type="number"
                            {...field}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                        {!canUpdateSMSRateLimit && (
                          <Alert_Shadcn_>
                            <IconAlertCircle strokeWidth={1.5} />
                            <AlertTitle_Shadcn_>
                              Enable phone-based logins to update this configuration
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_>
                              <p className="!leading-tight">
                                Head over to the providers page to enable phone provider and phone
                                confirmations before updating your rate limit
                              </p>
                              <Button asChild type="default" className="mt-2">
                                <Link href={`/project/${projectRef}/auth/providers`}>
                                  View providers configuration
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
                        Number of sessions that can be refreshed in a 5 minute interval
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
                          <Input_Shadcn_ type="number" {...field} />
                        </FormControl_Shadcn_>
                        {field.value > 0 && (
                          <>
                            <p className="text-foreground-lighter text-sm">
                              This is equivalent to {field.value * 12} requests per hour
                            </p>
                          </>
                        )}
                        <FormMessage_Shadcn_ />
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
                        interval
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
                          <Input_Shadcn_ type="number" {...field} />
                        </FormControl_Shadcn_>
                        {field.value > 0 && (
                          <p className="text-foreground-lighter text-sm">
                            This is equivalent to {field.value * 12} requests per hour
                          </p>
                        )}
                        <FormMessage_Shadcn_ />
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
