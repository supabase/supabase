import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { boolean, number, object, string } from 'yup'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import NoPermission from 'components/ui/NoPermission'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  Input,
  InputNumber,
  Toggle,
} from 'ui'
import { WarningIcon } from 'ui'
import FormField from '../AuthProvidersForm/FormField'

// Use a const string to represent no chars option. Represented as empty string on the backend side.
const NO_REQUIRED_CHARACTERS = 'NO_REQUIRED_CHARS'
const LETTERS_AND_DIGITS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789'
const LOWER_UPPER_DIGITS = 'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789'
const LOWER_UPPER_DIGITS_SYMBOLS = LOWER_UPPER_DIGITS + ':!@#$%^&*()_+-=[]{};\'\\\\:"|<>?,./`~'

const schema = object({
  DISABLE_SIGNUP: boolean().required(),
  EXTERNAL_ANONYMOUS_USERS_ENABLED: boolean().required(),
  SECURITY_MANUAL_LINKING_ENABLED: boolean().required(),
  SITE_URL: string().required('Must have a Site URL'),
  SECURITY_CAPTCHA_ENABLED: boolean().required(),
  SECURITY_CAPTCHA_SECRET: string().when('SECURITY_CAPTCHA_ENABLED', {
    is: true,
    then: (schema) => schema.required('Must have a Captcha secret'),
  }),
  SECURITY_CAPTCHA_PROVIDER: string().when('SECURITY_CAPTCHA_ENABLED', {
    is: true,
    then: (schema) =>
      schema
        .oneOf(['hcaptcha', 'turnstile'])
        .required('Captcha provider must be either hcaptcha or turnstile'),
  }),
  SESSIONS_TIMEBOX: number().min(0, 'Must be a positive number'),
  SESSIONS_INACTIVITY_TIMEOUT: number().min(0, 'Must be a positive number'),
  SESSIONS_SINGLE_PER_USER: boolean(),
  PASSWORD_MIN_LENGTH: number().min(6, 'Must be greater or equal to 6.'),
  PASSWORD_REQUIRED_CHARACTERS: string(),
  PASSWORD_HIBP_ENABLED: boolean(),
})

function HoursOrNeverText({ value }: { value: number }) {
  if (value === 0) {
    return 'never'
  } else if (value === 1) {
    return 'hour'
  } else {
    return 'hours'
  }
}

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

  const [hidden, setHidden] = useState(true)
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery(
    {
      orgSlug: organization?.slug,
    },
    { enabled: IS_PLATFORM }
  )

  const isProPlanAndUp = isSuccessSubscription && subscription?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const INITIAL_VALUES = {
    DISABLE_SIGNUP: !authConfig?.DISABLE_SIGNUP,
    EXTERNAL_ANONYMOUS_USERS_ENABLED: authConfig?.EXTERNAL_ANONYMOUS_USERS_ENABLED,
    SECURITY_MANUAL_LINKING_ENABLED: authConfig?.SECURITY_MANUAL_LINKING_ENABLED || false,
    SITE_URL: authConfig?.SITE_URL,
    SECURITY_CAPTCHA_ENABLED: authConfig?.SECURITY_CAPTCHA_ENABLED || false,
    SECURITY_CAPTCHA_SECRET: authConfig?.SECURITY_CAPTCHA_SECRET || '',
    SECURITY_CAPTCHA_PROVIDER: authConfig?.SECURITY_CAPTCHA_PROVIDER || 'hcaptcha',
    SESSIONS_TIMEBOX: authConfig?.SESSIONS_TIMEBOX || 0,
    SESSIONS_INACTIVITY_TIMEOUT: authConfig?.SESSIONS_INACTIVITY_TIMEOUT || 0,
    SESSIONS_SINGLE_PER_USER: authConfig?.SESSIONS_SINGLE_PER_USER || false,
    PASSWORD_MIN_LENGTH: authConfig?.PASSWORD_MIN_LENGTH || 6,
    PASSWORD_REQUIRED_CHARACTERS:
      authConfig?.PASSWORD_REQUIRED_CHARACTERS || NO_REQUIRED_CHARACTERS,
    PASSWORD_HIBP_ENABLED: authConfig?.PASSWORD_HIBP_ENABLED || false,
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
    <Form id={formId} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
      {({ handleReset, resetForm, values, initialValues }: any) => {
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
                              icon={<ExternalLink size={14} />}
                            >
                              <Link href="/docs/guides/auth/auth-anonymous#access-control">
                                View access control docs
                              </Link>
                            </Button>
                          </AlertDescription_Shadcn_>
                        </div>
                      </Alert_Shadcn_>
                      {!values.SECURITY_CAPTCHA_ENABLED && (
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
                    </div>
                  )}
                </FormSectionContent>
              </FormSection>
              <FormSection header={<FormSectionLabel>Passwords</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <InputNumber
                    id="PASSWORD_MIN_LENGTH"
                    size="small"
                    label="Minimum password length"
                    descriptionText="Passwords shorter than this value will be rejected as weak. Minimum 6, recommended 8 or more."
                    actions={<span className="mr-3 text-foreground-lighter">characters</span>}
                    disabled={!canUpdateConfig}
                  />
                  <FormField
                    name="PASSWORD_REQUIRED_CHARACTERS"
                    properties={{
                      type: 'select',
                      title: 'Password Requirements',
                      description:
                        'Passwords that do not have at least one of each will be rejected as weak.',
                      enum: [
                        {
                          label: 'No required characters (default)',
                          value: NO_REQUIRED_CHARACTERS,
                        },
                        {
                          label: 'Letters and digits',
                          value: LETTERS_AND_DIGITS,
                        },
                        {
                          label: 'Lowercase, uppercase letters and digits',
                          value: LOWER_UPPER_DIGITS,
                        },
                        {
                          label: 'Lowercase, uppercase letters, digits and symbols (recommended)',
                          value: LOWER_UPPER_DIGITS_SYMBOLS,
                        },
                      ],
                    }}
                    formValues={values}
                  />
                  {!promptProPlanUpgrade ? (
                    <></>
                  ) : (
                    <UpgradeToPro
                      primaryText="Upgrade to Pro"
                      secondaryText="Leaked password protection available on Pro plans and up."
                    />
                  )}
                  <Toggle
                    id="PASSWORD_HIBP_ENABLED"
                    size="small"
                    label="Prevent use of leaked passwords"
                    afterLabel=" (recommended)"
                    layout="flex"
                    descriptionText="Rejects the use of known or easy to guess passwords on sign up or password change. Powered by the HaveIBeenPwned.org Pwned Passwords API."
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection header={<FormSectionLabel>User Sessions</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  {!promptProPlanUpgrade ? (
                    <></>
                  ) : (
                    <UpgradeToPro
                      primaryText="Upgrade to Pro"
                      secondaryText="Configuring user sessions requires the Pro Plan."
                    />
                  )}
                  <Toggle
                    id="SESSIONS_SINGLE_PER_USER"
                    size="small"
                    label="Enforce single session per user"
                    layout="flex"
                    descriptionText="If enabled, all but a user's most recently active session will be terminated."
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                  <InputNumber
                    id="SESSIONS_TIMEBOX"
                    size="small"
                    label="Time-box user sessions"
                    descriptionText="The amount of time before a user is forced to sign in again. Use 0 for never"
                    actions={
                      <span className="mr-3 text-foreground-lighter">
                        <HoursOrNeverText value={values.SESSIONS_TIMEBOX} />
                      </span>
                    }
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                  <InputNumber
                    id="SESSIONS_INACTIVITY_TIMEOUT"
                    size="small"
                    label="Inactivity timeout"
                    descriptionText="The amount of time a user needs to be inactive to be forced to sign in again. Use 0 for never."
                    actions={
                      <span className="mr-3 text-foreground-lighter">
                        <HoursOrNeverText value={values.SESSIONS_INACTIVITY_TIMEOUT} />
                      </span>
                    }
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection
                id="enable-captcha"
                header={<FormSectionLabel>Bot and Abuse Protection</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <Toggle
                    id="SECURITY_CAPTCHA_ENABLED"
                    size="small"
                    label="Enable Captcha protection"
                    layout="flex"
                    descriptionText="Protect authentication endpoints from bots and abuse."
                    disabled={!canUpdateConfig}
                  />
                  {values.SECURITY_CAPTCHA_ENABLED && (
                    <>
                      <FormField
                        name="SECURITY_CAPTCHA_PROVIDER"
                        properties={{
                          type: 'select',
                          title: 'Choose Captcha Provider',
                          description: '',
                          enum: [
                            {
                              label: 'hCaptcha',
                              value: 'hcaptcha',
                              icon: 'hcaptcha-icon.png',
                            },
                            {
                              label: 'Turnstile by Cloudflare',
                              value: 'turnstile',
                              icon: 'cloudflare-icon.png',
                            },
                          ],
                        }}
                        formValues={values}
                      />
                      <Input
                        id="SECURITY_CAPTCHA_SECRET"
                        type={hidden ? 'password' : 'text'}
                        size="small"
                        label="Captcha secret"
                        descriptionText="Obtain this secret from the provider."
                        disabled={!canUpdateConfig}
                        actions={
                          <Button
                            icon={hidden ? <Eye /> : <EyeOff />}
                            type="default"
                            onClick={() => setHidden(!hidden)}
                          />
                        }
                      />
                    </>
                  )}
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default BasicAuthSettingsForm
