import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { boolean, number, object, string } from 'yup'

import { useParams } from 'common'
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
  Input,
  Toggle,
  WarningIcon,
} from 'ui'
import { NO_REQUIRED_CHARACTERS } from '../Auth.constants'
import FormField from '../AuthProvidersForm/FormField'

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

const formId = 'auth-config-protection-settings'

const ProtectionAuthSettingsForm = () => {
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
    <div>
      <FormHeader
        title="Bot and Abuse Protection"
        description="Configure protection settings for your application."
      />

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
                          setFieldValue={setFieldValue}
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
    </div>
  )
}

export default ProtectionAuthSettingsForm
