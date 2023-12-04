import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  Input,
  InputNumber,
  Radio,
  Toggle,
} from 'ui'
import { boolean, number, object, string } from 'yup'

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useFlag, useSelectedOrganization, useStore } from 'hooks'

// Use a const string to represent no chars option. Represented as empty string on the backend side.
const NO_REQUIRED_CHARACTERS = 'NO_REQUIRED_CHARS'
const LETTERS_AND_DIGITS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789'
const LOWER_UPPER_DIGITS = 'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789'
const LOWER_UPPER_DIGITS_SYMBOLS = LOWER_UPPER_DIGITS + ':!@#$%^&*()_+-=[]{};\'\\\\:"|<>?,./`~'

const schema = object({
  DISABLE_SIGNUP: boolean().required(),
  SITE_URL: string().required('Must have a Site URL'),
  SECURITY_CAPTCHA_ENABLED: boolean().required(),
  SECURITY_CAPTCHA_SECRET: string().when('SECURITY_CAPTCHA_ENABLED', {
    is: true,
    then: string().required('Must have a Captcha secret'),
  }),
  SECURITY_CAPTCHA_PROVIDER: string().when('SECURITY_CAPTCHA_ENABLED', {
    is: true,
    then: string()
      .oneOf(['hcaptcha', 'turnstile'])
      .required('Captcha provider must be either hcaptcha or turnstile'),
  }),
  SESSIONS_TIMEBOX: number().min(0, 'Must be a positive number'),
  SESSIONS_INACTIVITY_TIMEOUT: number().min(0, 'Must be a positive number'),
  SESSIONS_SINGLE_PER_USER: boolean(),
  PASSWORD_MIN_LENGTH: number().min(6, 'Must be greater or equal to 6.'),
  PASSWORD_REQUIRED_CHARACTERS: string(),
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

const BasicAuthSettingsForm = observer(() => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const formId = 'auth-config-basic-settings'
  const [hidden, setHidden] = useState(true)
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization!.slug,
  })

  const isProPlanAndUp = isSuccessSubscription && subscription?.plan?.id !== 'free'
  const singlePerUserReleased = useFlag('authSingleSessionPerUserReleased')
  const passwordStrengthReleased = useFlag('authPasswordStrengthReleased')

  const INITIAL_VALUES = {
    DISABLE_SIGNUP: !authConfig?.DISABLE_SIGNUP,
    SITE_URL: authConfig?.SITE_URL,
    SECURITY_CAPTCHA_ENABLED: authConfig?.SECURITY_CAPTCHA_ENABLED || false,
    SECURITY_CAPTCHA_SECRET: authConfig?.SECURITY_CAPTCHA_SECRET || '',
    SECURITY_CAPTCHA_PROVIDER: authConfig?.SECURITY_CAPTCHA_PROVIDER || 'hcaptcha',
    SESSIONS_TIMEBOX: authConfig?.SESSIONS_TIMEBOX || 0,
    SESSIONS_INACTIVITY_TIMEOUT: authConfig?.SESSIONS_INACTIVITY_TIMEOUT || 0,

    ...(singlePerUserReleased
      ? {
          SESSIONS_SINGLE_PER_USER: authConfig?.SESSIONS_SINGLE_PER_USER || false,
        }
      : null),

    ...(passwordStrengthReleased
      ? {
          PASSWORD_MIN_LENGTH: authConfig?.PASSWORD_MIN_LENGTH || 6,
          PASSWORD_REQUIRED_CHARACTERS:
            authConfig?.PASSWORD_REQUIRED_CHARACTERS || NO_REQUIRED_CHARACTERS,
        }
      : null),
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
          ui.setNotification({
            category: 'error',
            message: `Failed to update settings:  ${error?.message}`,
          })
        },
        onSuccess: () => {
          ui.setNotification({
            category: 'success',
            message: `Successfully updated settings`,
          })
          resetForm({ values: values, initialValues: values })
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <IconAlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <Form id={formId} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
      {({ handleReset, resetForm, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // Form is reset once remote data is loaded in store
        useEffect(() => {
          if (isSuccess) resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
        }, [isSuccess])

        return (
          <>
            <FormHeader
              title="Auth Settings"
              description="Configure security and user session settings."
            />
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
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-muted"></div>
              {passwordStrengthReleased && (
                <>
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
                      <>
                        <Radio.Group
                          id="PASSWORD_REQUIRED_CHARACTERS"
                          name="PASSWORD_REQUIRED_CHARACTERS"
                          label="Required characters"
                          descriptionText="Passwords that do not have at least one of each will be rejected as weak."
                        >
                          <Radio
                            label="No required characters"
                            value={NO_REQUIRED_CHARACTERS}
                            checked={values.PASSWORD_REQUIRED_CHARACTERS === NO_REQUIRED_CHARACTERS}
                            description="(default)"
                          />
                          <Radio
                            label="Letters and digits"
                            value={LETTERS_AND_DIGITS}
                            checked={values.PASSWORD_REQUIRED_CHARACTERS === LETTERS_AND_DIGITS}
                          />
                          <Radio
                            label="Lowercase, uppercase letters and digits"
                            value={LOWER_UPPER_DIGITS}
                            checked={values.PASSWORD_REQUIRED_CHARACTERS === LOWER_UPPER_DIGITS}
                          />
                          <Radio
                            label="Lowercase, uppercase letters, digits and symbols"
                            value={LOWER_UPPER_DIGITS_SYMBOLS}
                            checked={
                              values.PASSWORD_REQUIRED_CHARACTERS === LOWER_UPPER_DIGITS_SYMBOLS
                            }
                            description="(recommended)"
                          />
                        </Radio.Group>
                      </>
                    </FormSectionContent>
                  </FormSection>
                  <div className="border-t border-muted"></div>
                </>
              )}
              <FormSection header={<FormSectionLabel>User Sessions</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  {isProPlanAndUp ? (
                    <></>
                  ) : (
                    <UpgradeToPro
                      primaryText="Upgrade to Pro"
                      secondaryText="Configuring user sessions requires the Pro plan."
                      projectRef={projectRef!}
                      organizationSlug={organization!.slug}
                    />
                  )}
                  {singlePerUserReleased && (
                    <Toggle
                      id="SESSIONS_SINGLE_PER_USER"
                      size="small"
                      label="Enforce single session per user"
                      layout="flex"
                      descriptionText="If enabled, all but a user's most recently active session will be terminated."
                      disabled={!canUpdateConfig || !isProPlanAndUp}
                    />
                  )}
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
              <div className="border-t border-scale-400"></div>
              <FormSection header={<FormSectionLabel>Bot and Abuse Protection</FormSectionLabel>}>
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
                      <Radio.Group
                        id="SECURITY_CAPTCHA_PROVIDER"
                        name="SECURITY_CAPTCHA_PROVIDER"
                        label="Choose Captcha Provider"
                      >
                        <Radio
                          label="hCaptcha"
                          value="hcaptcha"
                          checked={values.SECURITY_CAPTCHA_PROVIDER === 'hcaptcha'}
                        />
                        <Radio
                          label="Turnstile by Cloudflare"
                          value="turnstile"
                          checked={values.SECURITY_CAPTCHA_PROVIDER === 'turnstile'}
                        />
                      </Radio.Group>
                      <Input
                        id="SECURITY_CAPTCHA_SECRET"
                        type={hidden ? 'password' : 'text'}
                        size="small"
                        label="Captcha secret"
                        descriptionText="Obtain this secret from the provider."
                        disabled={!canUpdateConfig}
                        actions={
                          <Button
                            icon={hidden ? <IconEye /> : <IconEyeOff />}
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
})

export default BasicAuthSettingsForm
