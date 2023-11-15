import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Form,
  IconAlertCircle,
  InputNumber,
  Toggle,
} from 'ui'
import { boolean, number, object } from 'yup'

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

const schema = object({
  JWT_EXP: number()
    .max(604800, 'Must be less than 604800')
    .required('Must have a JWT expiry value'),
  REFRESH_TOKEN_ROTATION_ENABLED: boolean().required(),
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: number()
    .min(0, 'Must be a value more than 0')
    .required('Must have a Reuse Interval value'),
  MFA_MAX_ENROLLED_FACTORS: number()
    .min(0, 'Must be be a value more than 0')
    .max(30, 'Must be a value less than 30'),
})

const AdvancedAuthSettingsForm = observer(() => {
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

  const formId = 'auth-config-advanced-form'
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const INITIAL_VALUES = {
    SITE_URL: authConfig?.SITE_URL,
    JWT_EXP: authConfig?.JWT_EXP,
    REFRESH_TOKEN_ROTATION_ENABLED: authConfig?.REFRESH_TOKEN_ROTATION_ENABLED || false,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    MFA_MAX_ENROLLED_FACTORS: authConfig?.MFA_MAX_ENROLLED_FACTORS || 10,
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }

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
              title="Advanced Settings"
              description="These settings rarely need to be changed."
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
              <FormSection header={<FormSectionLabel>Access Tokens (JWT)</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <InputNumber
                    id="JWT_EXP"
                    size="small"
                    label="Access token (JWT) expiry time"
                    descriptionText="How long access tokens are valid for before a refresh token has to be used. Recommendation: 3600 (1 hour)."
                    actions={<span className="mr-3 text-foreground-lighter">seconds</span>}
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>
              <FormSection header={<FormSectionLabel>Refresh Tokens</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <Toggle
                    id="REFRESH_TOKEN_ROTATION_ENABLED"
                    size="small"
                    label="Detect and revoke potentially compromised refresh tokens"
                    layout="flex"
                    descriptionText="Prevent replay attacks from potentially compromised refresh tokens. Recommendation: ON."
                    disabled={!canUpdateConfig}
                  />
                  {values.REFRESH_TOKEN_ROTATION_ENABLED && (
                    <InputNumber
                      id="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                      size="small"
                      min={0}
                      label="Refresh token reuse interval"
                      descriptionText="Time interval where the same refresh token can be used multiple times to request for an access token. Recommendation: 10 seconds."
                      actions={<span className="mr-3 text-foreground-lighter">seconds</span>}
                      disabled={!canUpdateConfig}
                    />
                  )}
                </FormSectionContent>
              </FormSection>
              <FormSection
                header={<FormSectionLabel>Multi-Factor Authentication (MFA)</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  <InputNumber
                    id="MFA_MAX_ENROLLED_FACTORS"
                    size="small"
                    label="Maximum number of per-user MFA factors"
                    descriptionText="How many MFA factors can be enrolled at once per user."
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

export default AdvancedAuthSettingsForm
