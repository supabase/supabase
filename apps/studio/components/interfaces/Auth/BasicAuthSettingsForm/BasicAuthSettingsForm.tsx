import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { boolean, object, string } from 'yup'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { FormFieldWrapper } from 'components/ui/Forms'
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
  CardHeader,
  CardTitle,
  Form_Shadcn_,
  Switch,
  WarningIcon,
} from 'ui'
import { SectionHeader } from 'components/layouts/PageLayout'

// Use a const string to represent no chars option. Represented as empty string on the backend side.
const NO_REQUIRED_CHARACTERS = 'NO_REQUIRED_CHARS'

const schema = object({
  DISABLE_SIGNUP: boolean().required(),
  EXTERNAL_ANONYMOUS_USERS_ENABLED: boolean().required(),
  SECURITY_MANUAL_LINKING_ENABLED: boolean().required(),
  SITE_URL: string().required('Must have a Site URL'),
})

const BasicAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      DISABLE_SIGNUP: true,
      EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
      SECURITY_MANUAL_LINKING_ENABLED: false,
      SITE_URL: '',
    },
  })

  useEffect(() => {
    if (authConfig) {
      form.reset({
        DISABLE_SIGNUP: !authConfig.DISABLE_SIGNUP,
        EXTERNAL_ANONYMOUS_USERS_ENABLED: authConfig.EXTERNAL_ANONYMOUS_USERS_ENABLED,
        SECURITY_MANUAL_LINKING_ENABLED: authConfig.SECURITY_MANUAL_LINKING_ENABLED || false,
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
    return <NoPermission resourceText="view auth configuration settings" />
  }

  return (
    <div>
      <SectionHeader title="User Signups" />

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardContent>
              <FormFieldWrapper
                control={form.control}
                name="DISABLE_SIGNUP"
                label="Allow new users to sign up"
                description="If this is disabled, new users will not be able to sign up to your application."
                orientation="horizontal"
              >
                {(field) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!canUpdateConfig}
                  />
                )}
              </FormFieldWrapper>
            </CardContent>
            <CardContent>
              <FormFieldWrapper
                control={form.control}
                name="SECURITY_MANUAL_LINKING_ENABLED"
                label="Allow manual linking"
                description={
                  <Markdown
                    extLinks
                    className="[&>p>a]:text-foreground-light [&>p>a]:transition-all [&>p>a]:hover:text-foreground [&>p>a]:hover:decoration-brand"
                    content="Enable [manual linking APIs](https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta) for your project."
                  />
                }
                orientation="horizontal"
              >
                {(field) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!canUpdateConfig}
                  />
                )}
              </FormFieldWrapper>
            </CardContent>
            <CardContent>
              <FormFieldWrapper
                control={form.control}
                name="EXTERNAL_ANONYMOUS_USERS_ENABLED"
                label="Allow anonymous sign-ins"
                description={
                  <Markdown
                    extLinks
                    className="[&>p>a]:text-foreground-light [&>p>a]:transition-all [&>p>a]:hover:text-foreground [&>p>a]:hover:decoration-brand"
                    content="Enable [anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous) for your project."
                  />
                }
                orientation="horizontal"
              >
                {(field) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!canUpdateConfig}
                  />
                )}
              </FormFieldWrapper>

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
                      <span
                        tabIndex={1}
                        className="cursor-pointer underline"
                        onClick={() => {
                          const el = document.getElementById('enable-captcha')
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }}
                      >
                        enabling captcha
                      </span>{' '}
                      for anonymous sign-ins
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      This will prevent potential abuse on sign-ins which may bloat your database
                      and incur costs for monthly active users (MAU)
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="primary"
                htmlType="submit"
                disabled={!canUpdateConfig || isUpdatingConfig}
                loading={isUpdatingConfig}
              >
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form_Shadcn_>
    </div>
  )
}

export default BasicAuthSettingsForm
