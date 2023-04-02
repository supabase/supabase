import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { boolean, number, object, string } from 'yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Button, Form, Input, IconEye, IconEyeOff, InputNumber, Toggle } from 'ui'

import { useStore, checkPermissions } from 'hooks'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'

const AutoSchemaForm = observer(() => {
  const { authConfig, ui } = useStore()
  const { isLoaded } = authConfig

  const formId = 'auth-config-general-form'
  const [hidden, setHidden] = useState(true)
  const canUpdateConfig = checkPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const INITIAL_VALUES = {
    DISABLE_SIGNUP: !authConfig.config.DISABLE_SIGNUP,
    SITE_URL: authConfig.config.SITE_URL,
    JWT_EXP: authConfig.config.JWT_EXP,
    REFRESH_TOKEN_ROTATION_ENABLED: authConfig.config.REFRESH_TOKEN_ROTATION_ENABLED || false,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig.config.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    SECURITY_CAPTCHA_ENABLED: authConfig.config.SECURITY_CAPTCHA_ENABLED || false,
    SECURITY_CAPTCHA_SECRET: authConfig.config.SECURITY_CAPTCHA_SECRET || '',
    MAX_ENROLLED_FACTORS: authConfig.config.MAX_ENROLLED_FACTORS,
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
      then: string().required('Must have a hCaptcha secret'),
    }),
    MAX_ENROLLED_FACTORS: number()
      .min(0, 'Must be be a value more than 0')
      .max(30, 'Must be a value less than 30'),
  })

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    const payload = { ...values }
    payload.DISABLE_SIGNUP = !values.DISABLE_SIGNUP
    payload.SECURITY_CAPTCHA_PROVIDER = 'hcaptcha'

    setSubmitting(true)
    const { error } = await authConfig.update(payload)

    if (!error) {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated settings`,
      })
      resetForm({ values: values, initialValues: values })
    } else {
      ui.setNotification({
        category: 'error',
        message: `Failed to update settings`,
      })
    }

    setSubmitting(false)
  }

  return (
    <Form id={formId} initialValues={INITIAL_VALUES} onSubmit={onSubmit} validationSchema={schema}>
      {({ isSubmitting, handleReset, resetForm, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // Form is reset once remote data is loaded in store
        useEffect(() => {
          resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
        }, [authConfig.isLoaded])

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
                    isSubmitting={isSubmitting}
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
                <FormSectionContent loading={!isLoaded}>
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
                <FormSectionContent loading={!isLoaded}>
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
                <FormSectionContent loading={!isLoaded}>
                  <Toggle
                    id="SECURITY_CAPTCHA_ENABLED"
                    size="small"
                    label="Enable hCaptcha protection"
                    layout="flex"
                    descriptionText="Protect authentication endpoints from abuse."
                    disabled={!canUpdateConfig}
                  />
                  {values.SECURITY_CAPTCHA_ENABLED && (
                    <Input
                      id="SECURITY_CAPTCHA_SECRET"
                      type={hidden ? 'password' : 'text'}
                      size="small"
                      label="hCaptcha secret"
                      disabled={!canUpdateConfig}
                      actions={
                        <Button
                          icon={hidden ? <IconEye /> : <IconEyeOff />}
                          type="default"
                          onClick={() => setHidden(!hidden)}
                        />
                      }
                    />
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
                <FormSectionContent loading={!isLoaded}>
                  <InputNumber
                    id="MAX_ENROLLED_FACTORS"
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
