import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { boolean, number, object, string } from 'yup'
import { Button, Form, Input, IconEye, IconEyeOff, InputNumber, Toggle } from '@supabase/ui'

import { useStore } from 'hooks'
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

  const INITIAL_VALUES = {
    DISABLE_SIGNUP: !authConfig.config.DISABLE_SIGNUP,
    JWT_EXP: authConfig.config.JWT_EXP,
    SITE_URL: authConfig.config.SITE_URL,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig.config.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    SECURITY_CAPTCHA_ENABLED: authConfig.config.SECURITY_CAPTCHA_ENABLED || false,
    SECURITY_CAPTCHA_SECRET: authConfig.config.SECURITY_CAPTCHA_SECRET || '',
  }

  const schema = object({
    DISABLE_SIGNUP: boolean().required(),
    SITE_URL: string().required('Must have a Site URL'),
    JWT_EXP: number()
      .max(604800, 'Must be less than 604800')
      .required('Must have a JWT expiry value'),
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: number()
      .min(0, 'Must be a value more than 0')
      .required('Must have a Reuse Interval value'),
    SECURITY_CAPTCHA_ENABLED: boolean().required(),
    SECURITY_CAPTCHA_SECRET: string().when('SECURITY_CAPTCHA_ENABLED', {
      is: true,
      then: string().required('Must have a hCaptcha secret'),
    }),
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
              title="General settings"
              description="Configure authentication sessions for your users"
            />
            <FormPanel
              disabled={true}
              footer={
                <div className="flex justify-between py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
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
                  />
                </FormSectionContent>
              </FormSection>
              <div className="border-t border-scale-400"></div>
              <FormSection header={<FormSectionLabel>User Sessions</FormSectionLabel>}>
                <FormSectionContent loading={!isLoaded}>
                  {/* Permitted redirects for anything on that domain */}
                  {/* Check with @kangming about this */}
                  <Input
                    id="SITE_URL"
                    size="small"
                    label="Site URL"
                    descriptionText="The base URL of your website. Used as an allow-list for redirects and for constructing URLs used in emails."
                  />
                  <InputNumber
                    id="JWT_EXP"
                    size="small"
                    label="JWT expiry limit"
                    descriptionText="How long tokens are valid for. Defaults to 3600 (1 hour), maximum 604,800 seconds (one week)."
                    actions={<span className="text-scale-900 mr-3">seconds</span>}
                  />
                  <InputNumber
                    id="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                    size="small"
                    min={0}
                    label="Reuse Interval"
                    descriptionText="Time interval where the same refresh token can be used to request for an access token."
                    actions={<span className="text-scale-900 mr-3">seconds</span>}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection header={<FormSectionLabel>Security and Protection</FormSectionLabel>}>
                <FormSectionContent loading={!isLoaded}>
                  <Toggle
                    id="SECURITY_CAPTCHA_ENABLED"
                    size="small"
                    label="hCaptcha protection"
                    layout="flex"
                    descriptionText="If enabled, protects auth endpoints from abuse."
                  />
                  {values.SECURITY_CAPTCHA_ENABLED && (
                    <Input
                      id="SECURITY_CAPTCHA_SECRET"
                      type={hidden ? 'password' : 'text'}
                      size="small"
                      label="hCaptcha secret"
                      actions={
                        <Button
                          icon={hidden ? <IconEye /> : <IconEyeOff />}
                          type="default"
                          onClick={() => setHidden(!hidden)}
                        />
                      }
                    />
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

export default AutoSchemaForm
