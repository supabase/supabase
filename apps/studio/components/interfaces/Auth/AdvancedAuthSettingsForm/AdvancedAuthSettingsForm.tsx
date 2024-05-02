import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
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

import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import UpgradeToPro from 'components/ui/UpgradeToPro'

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
    .max(30, 'Must be a value no greater than 30'),
  DB_MAX_POOL_SIZE: number()
    .min(1, 'Must be 1 or larger')
    .max(200, 'Must be a value no greater than 200'),
  API_MAX_REQUEST_DURATION: number()
    .min(5, 'Must be 5 or larger')
    .max(30, 'Must be a value no greater than 30'),
})

const AdvancedAuthSettingsForm = () => {
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

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })

  const isTeamsEnterprisePlan =
    isSuccessSubscription && subscription.plan.id !== 'free' && subscription.plan.id !== 'pro'
  const promptTeamsEnterpriseUpgrade = IS_PLATFORM && !isTeamsEnterprisePlan

  const INITIAL_VALUES = {
    SITE_URL: authConfig?.SITE_URL,
    JWT_EXP: authConfig?.JWT_EXP,
    REFRESH_TOKEN_ROTATION_ENABLED: authConfig?.REFRESH_TOKEN_ROTATION_ENABLED || false,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    MFA_MAX_ENROLLED_FACTORS: authConfig?.MFA_MAX_ENROLLED_FACTORS || 10,
    DB_MAX_POOL_SIZE: authConfig?.DB_MAX_POOL_SIZE || 10,
    API_MAX_REQUEST_DURATION: authConfig?.API_MAX_REQUEST_DURATION || 10,
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }

    if (!isTeamsEnterprisePlan) {
      delete payload.DB_MAX_POOL_SIZE
      delete payload.API_MAX_REQUEST_DURATION
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update settings: ${error?.message}`)
        },
        onSuccess: () => {
          toast.success('Successfully updated settings')
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
        // eslint-disable-next-line react-hooks/rules-of-hooks
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
                    actions={<span className="mr-3 text-foreground-lighter">factors</span>}
                    disabled={!canUpdateConfig}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection
                header={<FormSectionLabel>Max Direct Database Connections</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  {promptTeamsEnterpriseUpgrade && (
                    <UpgradeToPro
                      primaryText="Upgrade to Teams or Enterprise"
                      secondaryText="Max Direct Database Connections settings are only available on the Teams plan and up."
                      buttonText="Upgrade to Teams"
                      projectRef={projectRef!}
                      organizationSlug={organization!.slug}
                    />
                  )}

                  <InputNumber
                    id="DB_MAX_POOL_SIZE"
                    size="small"
                    label="Max direct database connections used by Auth"
                    descriptionText="Auth will take up no more than this number of connections from the total number of available connections to serve requests. These connections are not reserved, so when unused they are released."
                    actions={<span className="mr-3 text-foreground-lighter">connections</span>}
                    disabled={!canUpdateConfig || !isTeamsEnterprisePlan}
                  />
                </FormSectionContent>
              </FormSection>

              <FormSection header={<FormSectionLabel>Max Request Duration</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  {promptTeamsEnterpriseUpgrade && (
                    <UpgradeToPro
                      primaryText="Upgrade to Teams or Enterprise"
                      secondaryText="Max Request Duration settings are only available on the Teams plan and up."
                      buttonText="Upgrade to Teams"
                      projectRef={projectRef!}
                      organizationSlug={organization!.slug}
                    />
                  )}

                  <InputNumber
                    id="API_MAX_REQUEST_DURATION"
                    size="small"
                    label="Maximum time allowed for an Auth request to last"
                    descriptionText="Number of seconds to wait for an Auth request to complete before canceling it. In certain high-load situations setting a larger or smaller value can be used to control load-shedding. Recommended: 10 seconds."
                    actions={<span className="mr-3 text-foreground-lighter">seconds</span>}
                    disabled={!canUpdateConfig || !isTeamsEnterprisePlan}
                  />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default AdvancedAuthSettingsForm
