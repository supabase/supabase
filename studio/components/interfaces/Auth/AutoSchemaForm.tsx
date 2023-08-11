import { PermissionAction } from '@supabase/shared-types/out/constants'
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

import { useParams } from 'common'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'

const AutoSchemaForm = observer(() => {
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

  const formId = 'auth-config-general-form'
  const [hidden, setHidden] = useState(true)
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const INITIAL_VALUES = {
    DISABLE_SIGNUP: !authConfig?.DISABLE_SIGNUP,
    SITE_URL: authConfig?.SITE_URL,
    JWT_EXP: authConfig?.JWT_EXP,
    REFRESH_TOKEN_ROTATION_ENABLED: authConfig?.REFRESH_TOKEN_ROTATION_ENABLED || false,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    SECURITY_CAPTCHA_ENABLED: authConfig?.SECURITY_CAPTCHA_ENABLED || false,
    SECURITY_CAPTCHA_SECRET: authConfig?.SECURITY_CAPTCHA_SECRET || '',
    SECURITY_CAPTCHA_PROVIDER: authConfig?.SECURITY_CAPTCHA_PROVIDER || 'hcaptcha',
    MFA_MAX_ENROLLED_FACTORS: authConfig?.MFA_MAX_ENROLLED_FACTORS || 10,
  }

  const schema = object({
    DISABLE_SIGNUP: boolean().required(),
    SITE_URL: string().required('Must have a Site URL'),
    JWT_EXP: number()
      .max(604800, 'Must be less than 604800')
      .required('Must have a JWT expiry value'),
    REFRESH_TOKEN_ROTATION_ENABLED: boolean().required(),
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: number()
      .min(0, 'Must be a value more than 0')
      .required('Must have a Reuse Interval value'),
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
    MFA_MAX_ENROLLED_FACTORS: number()
      .min(0, 'Must be be a value more than 0')
      .max(30, 'Must be a value less than 30'),
  })

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }
    payload.DISABLE_SIGNUP = !values.DISABLE_SIGNUP

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
              title="Auth settings"
              description="Configure authentication sessions for your users"
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
              <div className="border-t border-scale-400"></div>
              <FormSection header={<FormSectionLabel>User Sessions</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  {/* Permitted redirects for anything on that domain */}
                  {/* Check with @kangming about this */}
                  <InputNumber
                    id="JWT_EXP"
                    size="small"
                    label="JWT expiry limit"
                    descriptionText="How long tokens are valid for. Defaults to 3600 (1 hour), maximum 604,800 seconds (one week)."
                    actions={<span className="mr-3 text-scale-900">seconds</span>}
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection header={<FormSectionLabel>Security and Protection</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <Toggle
                    id="SECURITY_CAPTCHA_ENABLED"
                    size="small"
                    label="Enable Captcha protection"
                    layout="flex"
                    descriptionText="Protect authentication endpoints from abuse."
                    disabled={!canUpdateConfig}
                  />
                  {values.SECURITY_CAPTCHA_ENABLED && (
                    <>
                      <Radio.Group
                        id="SECURITY_CAPTCHA_PROVIDER"
                        name="SECURITY_CAPTCHA_PROVIDER"
                        label="Captcha Providers"
                      >
                        <Radio
                          label="hCaptcha"
                          value="hcaptcha"
                          checked={values.SECURITY_CAPTCHA_PROVIDER === 'hcaptcha'}
                        />
                        <Radio
                          label="Turnstile (Cloudflare)"
                          value="turnstile"
                          checked={values.SECURITY_CAPTCHA_PROVIDER === 'turnstile'}
                        />
                      </Radio.Group>
                      <Input
                        id="SECURITY_CAPTCHA_SECRET"
                        type={hidden ? 'password' : 'text'}
                        size="small"
                        label="Captcha secret"
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
                  <Toggle
                    id="REFRESH_TOKEN_ROTATION_ENABLED"
                    size="small"
                    label="Enable automatic reuse detection"
                    layout="flex"
                    descriptionText="Prevent replay attacks from compromised refresh tokens."
                    disabled={!canUpdateConfig}
                  />
                  {values.REFRESH_TOKEN_ROTATION_ENABLED && (
                    <InputNumber
                      id="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                      size="small"
                      min={0}
                      label="Reuse interval"
                      descriptionText="Time interval where the same refresh token can be used to request for an access token."
                      actions={<span className="mr-3 text-scale-900">seconds</span>}
                      disabled={!canUpdateConfig}
                    />
                  )}
                </FormSectionContent>
              </FormSection>
              <FormSection
                header={<FormSectionLabel>Multi Factor Authentication (MFA)</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <InputNumber
                    id="MFA_MAX_ENROLLED_FACTORS"
                    size="small"
                    label="Maximum number of enrolled factors"
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
})

export default AutoSchemaForm
