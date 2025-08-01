import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { boolean, object, string } from 'yup'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
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
  Switch,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'

const schema = object({
  DISABLE_SIGNUP: boolean().required(),
  EXTERNAL_ANONYMOUS_USERS_ENABLED: boolean().required(),
  SECURITY_MANUAL_LINKING_ENABLED: boolean().required(),
  MAILER_AUTOCONFIRM: boolean().required(),
  SITE_URL: string().required('Must have a Site URL'),
})

const BasicAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      DISABLE_SIGNUP: true,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      SECURITY_MANUAL_LINKING_ENABLED: false,
      MAILER_AUTOCONFIRM: true,
      SITE_URL: '',
    },
  })

  useEffect(() => {
    if (authConfig) {
      form.reset({
        DISABLE_SIGNUP: !authConfig.DISABLE_SIGNUP,
        EXTERNAL_ANONYMOUS_USERS_ENABLED: authConfig.EXTERNAL_ANONYMOUS_USERS_ENABLED,
        SECURITY_MANUAL_LINKING_ENABLED: authConfig.SECURITY_MANUAL_LINKING_ENABLED,
        // The backend uses false to represent that email confirmation is required
        MAILER_AUTOCONFIRM: !authConfig.MAILER_AUTOCONFIRM,
        SITE_URL: authConfig.SITE_URL,
      })
    }
  }, [authConfig])

  const onSubmit = (values: any) => {
    const payload = { ...values }
    payload.DISABLE_SIGNUP = !values.DISABLE_SIGNUP
    // The backend uses empty string to represent no required characters in the password
    if (payload.PASSWORD_REQUIRED_CHARACTERS === NO_REQUIRED_CHARACTERS) {
      payload.PASSWORD_REQUIRED_CHARACTERS = ''
    }

    // The backend uses false to represent that email confirmation is required
    payload.MAILER_AUTOCONFIRM = !values.MAILER_AUTOCONFIRM

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update settings: ${error?.message}`)
        },
        onSuccess: () => {
          toast.success('Successfully updated settings')
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  if (!canReadConfig) {
    return (
      <div className="mt-8">
        <NoPermission resourceText="view auth configuration settings" />
      </div>
    )
  }

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">User Signups</ScaffoldSectionTitle>

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="DISABLE_SIGNUP"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Allow new users to sign up"
                    description="If this is disabled, new users will not be able to sign up to your application"
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
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="SECURITY_MANUAL_LINKING_ENABLED"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Allow manual linking"
                    description={
                      <>
                        Enable{' '}
                        <InlineLink
                          className="text-foreground-light hover:text-foreground"
                          href="https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta"
                        >
                          manual linking APIs
                        </InlineLink>{' '}
                        for your project
                      </>
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
            </CardContent>
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="EXTERNAL_ANONYMOUS_USERS_ENABLED"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Allow anonymous sign-ins"
                    description={
                      <>
                        Enable{' '}
                        <InlineLink
                          className="text-foreground-light hover:text-foreground"
                          href="https://supabase.com/docs/guides/auth/auth-anonymous"
                        >
                          anonymous sign-ins
                        </InlineLink>{' '}
                        for your project
                      </>
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

              {form.watch('EXTERNAL_ANONYMOUS_USERS_ENABLED') && (
                <Alert_Shadcn_
                  className="flex w-full items-center justify-between mt-4"
                  variant="warning"
                >
                  <WarningIcon />
                  <div>
                    <AlertTitle_Shadcn_>
                      Anonymous users will use the <code className="text-xs">authenticated</code>{' '}
                      role when signing in
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                      <p>
                        As a result, anonymous users will be subjected to RLS policies that apply to
                        the <code className="text-xs">public</code> and{' '}
                        <code className="text-xs">authenticated</code> roles. We strongly advise{' '}
                        <Link
                          href={`/project/${projectRef}/auth/policies`}
                          className="text-foreground underline"
                        >
                          reviewing your RLS policies
                        </Link>{' '}
                        to ensure that access to your data is restricted where required.
                      </p>
                      <Button asChild type="default" className="w-min" icon={<ExternalLink />}>
                        <Link href="https://supabase.com/docs/guides/auth/auth-anonymous#access-control">
                          View access control docs
                        </Link>
                      </Button>
                    </AlertDescription_Shadcn_>
                  </div>
                </Alert_Shadcn_>
              )}

              {!authConfig?.SECURITY_CAPTCHA_ENABLED &&
                form.watch('EXTERNAL_ANONYMOUS_USERS_ENABLED') && (
                  <Alert_Shadcn_ className="mt-4">
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      We highly recommend{' '}
                      <InlineLink href={`/project/${projectRef}/auth/protection`}>
                        enabling captcha
                      </InlineLink>{' '}
                      for anonymous sign-ins
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      This will prevent potential abuse on sign-ins which may bloat your database
                      and incur costs for monthly active users (MAU)
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
            </CardContent>
            <CardContent>
              <FormField_Shadcn_
                control={form.control}
                name="MAILER_AUTOCONFIRM"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Confirm email"
                    description="Users will need to confirm their email address before signing in for the first time"
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

export default BasicAuthSettingsForm
