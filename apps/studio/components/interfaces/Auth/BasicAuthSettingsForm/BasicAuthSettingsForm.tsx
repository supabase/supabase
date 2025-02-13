import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { boolean, object, string } from 'yup'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  Toggle,
  WarningIcon,
} from 'ui'
import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'

const schema = object({
  DISABLE_SIGNUP: boolean().required(),
  EXTERNAL_ANONYMOUS_USERS_ENABLED: boolean().required(),
  SECURITY_MANUAL_LINKING_ENABLED: boolean().required(),
  SITE_URL: string().required('Must have a Site URL'),
})

const formId = 'auth-config-basic-settings'

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

  const INITIAL_VALUES = {
    DISABLE_SIGNUP: !authConfig?.DISABLE_SIGNUP,
    EXTERNAL_ANONYMOUS_USERS_ENABLED: authConfig?.EXTERNAL_ANONYMOUS_USERS_ENABLED,
    SECURITY_MANUAL_LINKING_ENABLED: authConfig?.SECURITY_MANUAL_LINKING_ENABLED || false,
    SITE_URL: authConfig?.SITE_URL,
  }

  const onSubmit = (values: any, { resetForm }: any) => {
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
          toast.error(`Failed to update settings:  ${error?.message}`)
        },
        onSuccess: () => {
          toast.success(`Successfully updated settings`)
          resetForm({ values: values, initialValues: values })
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
      <FormHeader title="General" />

      <Form
        id={formId}
        initialValues={INITIAL_VALUES}
        onSubmit={onSubmit}
        validationSchema={schema}
      >
        {({ handleReset, resetForm, values, initialValues, setFieldValue }: any) => {
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
          // Form is reset once remote data is loaded in store
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (isSuccess) resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
          }, [isSuccess])

          return (
            <>
              <FormPanel
                disabled={true}
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isUpdatingConfig}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
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
                <FormSection header={<FormSectionLabel>User Signups</FormSectionLabel>}>
                  <FormSectionContent loading={isLoading}>
                    <Toggle
                      id="DISABLE_SIGNUP"
                      size="small"
                      label="Allow new users to sign up"
                      layout="flex"
                      descriptionText="If this is disabled, new users will not be able to sign up to your application."
                      disabled={!canUpdateConfig}
                    />
                    <Toggle
                      id="SECURITY_MANUAL_LINKING_ENABLED"
                      size="small"
                      label="Allow manual linking"
                      layout="flex"
                      descriptionText={
                        <Markdown
                          extLinks
                          className="[&>p>a]:text-foreground-light [&>p>a]:transition-all [&>p>a]:hover:text-foreground [&>p>a]:hover:decoration-brand"
                          content="Enable [manual linking APIs](https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta) for your project."
                        />
                      }
                      disabled={!canUpdateConfig}
                    />
                    <Toggle
                      id="EXTERNAL_ANONYMOUS_USERS_ENABLED"
                      size="small"
                      label="Allow anonymous sign-ins"
                      layout="flex"
                      descriptionText={
                        <Markdown
                          extLinks
                          className="[&>p>a]:text-foreground-light [&>p>a]:transition-all [&>p>a]:hover:text-foreground [&>p>a]:hover:decoration-brand"
                          content="Enable [anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous) for your project."
                        />
                      }
                      disabled={!canUpdateConfig}
                    />
                    {values.EXTERNAL_ANONYMOUS_USERS_ENABLED && (
                      <div className="flex flex-col gap-y-2">
                        <Alert_Shadcn_
                          className="flex w-full items-center justify-between"
                          variant="warning"
                        >
                          <WarningIcon />
                          <div>
                            <AlertTitle_Shadcn_>
                              Anonymous users will use the{' '}
                              <code className="text-xs">authenticated</code> role when signing in
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_ className="flex flex-col gap-y-3">
                              <p>
                                As a result, anonymous users will be subjected to RLS policies that
                                apply to the <code className="text-xs">public</code> and{' '}
                                <code className="text-xs">authenticated</code> roles. We strongly
                                advise{' '}
                                <Link
                                  href={`/project/${projectRef}/auth/policies`}
                                  className="text-foreground underline"
                                >
                                  reviewing your RLS policies
                                </Link>{' '}
                                to ensure that access to your data is restricted where required.
                              </p>
                              <Button
                                asChild
                                type="default"
                                className="w-min"
                                icon={<ExternalLink />}
                              >
                                <Link href="https://supabase.com/docs/guides/auth/auth-anonymous#access-control">
                                  View access control docs
                                </Link>
                              </Button>
                            </AlertDescription_Shadcn_>
                          </div>
                        </Alert_Shadcn_>
                      </div>
                    )}
                    {!authConfig?.SECURITY_CAPTCHA_ENABLED &&
                      values.EXTERNAL_ANONYMOUS_USERS_ENABLED && (
                        <Alert_Shadcn_>
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
                            This will prevent potential abuse on sign-ins which may bloat your
                            database and incur costs for monthly active users (MAU)
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      )}
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            </>
          )
        }}
      </Form>
    </div>
  )
}

export default BasicAuthSettingsForm
