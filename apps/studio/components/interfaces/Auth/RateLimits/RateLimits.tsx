import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  WarningIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'
import { ScaffoldSection } from 'components/layouts/Scaffold'

const RateLimits = () => {
  const { ref: projectRef } = useParams()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

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
  const canUpdateSMSRateLimit = authConfig?.EXTERNAL_PHONE_ENABLED
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
      RATE_LIMIT_ANONYMOUS_USERS: 0,
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

  if (isError) {
    return <AlertError subject="Failed to retrieve auth config rate limits" error={error} />
  }

  if (!canReadConfig) {
    return <NoPermission resourceText="view auth configuration settings" />
  }

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  return (
    <ScaffoldSection isFullWidth>
      <Form_Shadcn_ {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6">
              <FormField_Shadcn_
                control={form.control}
                name="RATE_LIMIT_EMAIL_SENT"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Rate limit for sending emails"
                    description="Number of emails that can be sent per hour from your project"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            type="number"
                            className="w-24"
                            min={0}
                            {...field}
                            disabled={!canUpdateConfig || !canUpdateEmailLimit}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {!canUpdateConfig || !canUpdateEmailLimit ? (
                        <TooltipContent side="left" className="w-80 p-4">
                          {!authConfig.EXTERNAL_EMAIL_ENABLED ? (
                            <>
                              <p className="font-medium">
                                Email-based logins are not enabled for your project
                              </p>
                              <p className="mt-1">
                                Enable email-based logins to update this rate limit
                              </p>
                              <div className="mt-3">
                                <Button asChild type="default" size="tiny">
                                  <Link href={`/project/${projectRef}/auth/providers`}>
                                    View auth providers
                                  </Link>
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">
                                Custom SMTP provider is required to update this configuration
                              </p>
                              <p className="mt-1">
                                The built-in email service has a fixed rate limit. You will need to
                                set up your own custom SMTP provider to update your email rate limit
                              </p>
                              <div className="mt-3">
                                <Button asChild type="default" size="tiny">
                                  <Link href={`/project/${projectRef}/settings/auth`}>
                                    View SMTP settings
                                  </Link>
                                </Button>
                              </div>
                            </>
                          )}
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </FormItemLayout>
                )}
              />
            </CardContent>

            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="RATE_LIMIT_SMS_SENT"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Rate limit for sending SMS messages"
                    description="Number of SMS messages that can be sent per hour from your project"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            type="number"
                            className="w-24"
                            min={0}
                            {...field}
                            disabled={!canUpdateConfig || !canUpdateSMSRateLimit}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {!canUpdateConfig || !canUpdateSMSRateLimit ? (
                        <TooltipContent side="left" className="w-80 p-4">
                          <p className="font-medium">
                            Phone-based logins are not enabled for your project
                          </p>
                          <p className="mt-1">
                            Enable phone-based logins to update this rate limit
                          </p>
                          <div className="mt-3">
                            <Button asChild type="default" size="tiny">
                              <Link href={`/project/${projectRef}/auth/providers`}>
                                View auth providers
                              </Link>
                            </Button>
                          </div>
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </FormItemLayout>
                )}
              />
            </CardContent>

            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="RATE_LIMIT_TOKEN_REFRESH"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Rate limit for token refreshes"
                    description="Number of sessions that can be refreshed in a 5 minute interval per IP address"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            type="number"
                            className="w-24"
                            min={0}
                            {...field}
                            disabled={!canUpdateConfig}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {!canUpdateConfig && (
                        <TooltipContent side="left" className="w-80 p-4">
                          <p className="font-medium">
                            You don't have permission to update this setting
                          </p>
                          <p className="mt-1">
                            You need additional permissions to update auth configuration settings
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    {form.watch('RATE_LIMIT_TOKEN_REFRESH') > 0 && (
                      <p className="text-foreground-lighter text-sm mt-2">
                        {form.watch('RATE_LIMIT_TOKEN_REFRESH') * 12} requests per hour
                      </p>
                    )}
                  </FormItemLayout>
                )}
              />
            </CardContent>

            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="RATE_LIMIT_VERIFY"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Rate limit for token verifications"
                    description="Number of OTP/Magic link verifications that can be made in a 5 minute interval per IP address"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            type="number"
                            className="w-24"
                            min={0}
                            {...field}
                            disabled={!canUpdateConfig}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {!canUpdateConfig && (
                        <TooltipContent side="left" className="w-80 p-4">
                          <p className="font-medium">
                            You don't have permission to update this setting
                          </p>
                          <p className="mt-1">
                            You need additional permissions to update auth configuration settings
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    {form.watch('RATE_LIMIT_VERIFY') > 0 && (
                      <p className="text-foreground-lighter text-sm mt-2">
                        {form.watch('RATE_LIMIT_VERIFY') * 12} requests per hour
                      </p>
                    )}
                  </FormItemLayout>
                )}
              />
            </CardContent>

            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="RATE_LIMIT_ANONYMOUS_USERS"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Rate limit for anonymous users"
                    description="Number of anonymous sign-ins that can be made per hour per IP address"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            type="number"
                            className="w-24"
                            min={0}
                            {...field}
                            disabled={!canUpdateConfig || !canUpdateAnonymousUsersRateLimit}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {!canUpdateConfig || !canUpdateAnonymousUsersRateLimit ? (
                        <TooltipContent side="left" className="w-80 p-4">
                          <p className="font-medium">
                            Anonymous logins are not enabled for your project
                          </p>
                          <p className="mt-1">Enable anonymous logins to update this rate limit</p>
                          <div className="mt-3">
                            <Button asChild type="default" size="tiny">
                              <Link href={`/project/${projectRef}/settings/auth`}>
                                View auth settings
                              </Link>
                            </Button>
                          </div>
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </FormItemLayout>
                )}
              />
            </CardContent>

            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="RATE_LIMIT_OTP"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Rate limit for sign ups and sign ins"
                    description="Number of sign up and sign-in requests that can be made in a 5 minute interval per IP address (excludes anonymous users)"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            type="number"
                            className="w-24"
                            min={0}
                            {...field}
                            disabled={!canUpdateConfig}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {!canUpdateConfig && (
                        <TooltipContent side="left" className="w-80 p-4">
                          <p className="font-medium">
                            You don't have permission to update this setting
                          </p>
                          <p className="mt-1">
                            You need additional permissions to update auth configuration settings
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    {form.watch('RATE_LIMIT_OTP') > 0 && (
                      <p className="text-foreground-lighter text-sm mt-2">
                        {form.watch('RATE_LIMIT_OTP') * 12} requests per hour
                      </p>
                    )}
                  </FormItemLayout>
                )}
              />
            </CardContent>

            <CardFooter className="justify-end space-x-2">
              {form.formState.isDirty && (
                <Button type="default" onClick={() => form.reset()}>
                  Cancel
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                disabled={!canUpdateConfig || isUpdatingConfig || !form.formState.isDirty}
                loading={isUpdatingConfig}
              >
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}

export default RateLimits
