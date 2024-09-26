import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { boolean, number, object, string } from 'yup'

import { useParams } from 'common'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormHeader } from 'components/ui/Forms/FormHeader'
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
import FormField from '../AuthProvidersForm/FormField'

import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Form,
  InputNumber,
  Toggle,
  WarningIcon,
} from 'ui'

const schema = object({
  JWT_EXP: number()
    .max(604800, 'Must be less than 604800')
    .required('Must have a JWT expiry value'),
  REFRESH_TOKEN_ROTATION_ENABLED: boolean().required(),
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: number()
    .min(0, 'Must be a value more than 0')
    .required('Must have a Reuse Interval value'),
  MFA_PHONE_OTP_LENGTH: number()
    .min(6, 'Must be a value 6 or larger')
    .max(30, 'must be a value no greater than 30'),
  MFA_PHONE_TEMPLATE: string().required('SMS template is required.'),
  MFA_MAX_ENROLLED_FACTORS: number()
    .min(0, 'Must be be a value more than 0')
    .max(30, 'Must be a value no greater than 30'),
  DB_MAX_POOL_SIZE: number()
    .min(1, 'Must be 1 or larger')
    .max(200, 'Must be a value no greater than 200'),
  API_MAX_REQUEST_DURATION: number()
    .min(5, 'Must be 5 or larger')
    .max(30, 'Must be a value no greater than 30'),
  MFA_TOTP: string().required(),
  MFA_PHONE: string().required(),
})

function determineMFAStatus(verifyEnabled: boolean, enrollEnabled: boolean) {
  return verifyEnabled ? (enrollEnabled ? 'Enabled' : 'Verify Enabled') : 'Disabled'
}

const MFAFactorSelectionOptions = [
  {
    label: 'Enabled',
    value: 'Enabled',
  },
  {
    label: 'Verify Enabled',
    value: 'Verify Enabled',
  },
  {
    label: 'Disabled',
    value: 'Disabled',
  },
]

const MfaStatusToState = (status: (typeof MFAFactorSelectionOptions)[number]['value']) => {
  return status === 'Enabled'
    ? { verifyEnabled: true, enrollEnabled: true }
    : status === 'Verify Enabled'
      ? { verifyEnabled: true, enrollEnabled: false }
      : { verifyEnabled: false, enrollEnabled: false }
}

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
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })

  const isTeamsEnterprisePlan =
    isSuccessSubscription && subscription.plan.id !== 'free' && subscription.plan.id !== 'pro'
  const isProPlanAndUp = isSuccessSubscription && subscription?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const projectAddons = subscription?.project_addons.find((addon) => addon.ref === projectRef)
  const hasPurchasedAuthMFAAddOn = projectAddons?.addons.some(
    (addon) => addon.type === 'auth_mfa_phone'
  )
  const promptTeamsEnterpriseUpgrade = IS_PLATFORM && !isTeamsEnterprisePlan

  const INITIAL_VALUES = {
    SITE_URL: authConfig?.SITE_URL,
    JWT_EXP: authConfig?.JWT_EXP,
    REFRESH_TOKEN_ROTATION_ENABLED: authConfig?.REFRESH_TOKEN_ROTATION_ENABLED || false,
    MFA_PHONE_OTP_LENGTH: authConfig?.MFA_PHONE_OTP_LENGTH || 6,
    MFA_PHONE_TEMPLATE: authConfig?.MFA_PHONE_TEMPLATE || 'Your code is {{ .Code }}',
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    MFA_MAX_ENROLLED_FACTORS: authConfig?.MFA_MAX_ENROLLED_FACTORS || 10,
    DB_MAX_POOL_SIZE: authConfig?.DB_MAX_POOL_SIZE || 10,
    API_MAX_REQUEST_DURATION: authConfig?.API_MAX_REQUEST_DURATION || 10,
    // TOTP is enabled by default. Auth environment variables are distinct from UI state - we use MFA_TOTP and MFA_PHONE to hold the derivedUI state.
    // MFA_TOTP_VERIFY_ENABLED and MFA_TOTP_ENROLL_ENABLED -> Enabled
    // MFA_TOTP_VERIFY_ENABLED and !MFA_TOTP_ENROLL_ENABLED -> Verify Enabled
    // !MFA_TOTP_VERIFY_ENABLED and !MFA_TOTP_ENROLL_ENABLED -> Disabled
    MFA_TOTP:
      determineMFAStatus(
        authConfig?.MFA_TOTP_VERIFY_ENABLED ?? true,
        authConfig?.MFA_TOTP_ENROLL_ENABLED ?? true
      ) || 'Enabled',
    MFA_PHONE:
      determineMFAStatus(
        authConfig?.MFA_PHONE_VERIFY_ENABLED || false,
        authConfig?.MFA_PHONE_ENROLL_ENABLED || false
      ) || 'Disabled',
  }

  // For now, we support Twilio and Vonage. Twilio Verify is not supported and the remaining providers are community maintained.
  const sendSMSHookIsEnabled =
    authConfig?.HOOK_SEND_SMS_URI !== null && authConfig?.HOOK_SEND_SMS_ENABLED === true
  const hasValidMFAPhoneProvider =
    authConfig?.EXTERNAL_PHONE_ENABLED === true &&
    (authConfig?.SMS_PROVIDER === 'twilio' || authConfig?.SMS_PROVIDER === 'vonage')
  const hasValidMFAProvider = hasValidMFAPhoneProvider || sendSMSHookIsEnabled
  const phoneMFAIsEnabled =
    INITIAL_VALUES.MFA_PHONE === 'Enabled' || INITIAL_VALUES.MFA_PHONE === 'Verify Enabled'

  const onSubmit = (values: any, { resetForm }: any) => {
    let payload = { ...values }
    const { verifyEnabled: MFA_TOTP_VERIFY_ENABLED, enrollEnabled: MFA_TOTP_ENROLL_ENABLED } =
      MfaStatusToState(values.MFA_TOTP)
    // MFA (Phone) is only available on Pro Plans and up. We translate the UI state, MFA_PHONE and MFA_TOTP into the underlying
    // Auth config state - MFA_PHONE_*_ENABLED and MFA_TOTP_*_ENABLED.
    if (isProPlanAndUp) {
      const { verifyEnabled: MFA_PHONE_VERIFY_ENABLED, enrollEnabled: MFA_PHONE_ENROLL_ENABLED } =
        MfaStatusToState(values.MFA_PHONE)
      payload = {
        ...payload,
        MFA_PHONE_ENROLL_ENABLED,
        MFA_PHONE_VERIFY_ENABLED,
      }
    }
    payload = {
      ...payload,
      MFA_TOTP_ENROLL_ENABLED,
      MFA_TOTP_VERIFY_ENABLED,
    }
    delete payload.MFA_TOTP
    delete payload.MFA_PHONE

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

        const hasUpgradedPhoneMFA =
          INITIAL_VALUES.MFA_PHONE === 'Disabled' && values.MFA_PHONE !== INITIAL_VALUES.MFA_PHONE

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
                  <FormField
                    name="MFA_TOTP"
                    properties={{
                      type: 'select',
                      title: 'TOTP (App Authenticator)',
                      description: 'Control use of TOTP (App Authenticator) factors',
                      enum: MFAFactorSelectionOptions,
                    }}
                    formValues={values}
                    disabled={!canUpdateConfig}
                  />

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
              <FormSection header={<FormSectionLabel>Advanced MFA</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  {promptProPlanUpgrade && (
                    <UpgradeToPro
                      primaryText="Upgrade to Pro"
                      secondaryText="Advanced MFA requires the Pro Plan"
                    />
                  )}
                  <FormField
                    name="MFA_PHONE"
                    properties={{
                      type: 'select',
                      title: 'Phone',
                      description: 'Control use of phone factors',
                      enum: MFAFactorSelectionOptions,
                    }}
                    formValues={values}
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                  {!hasValidMFAProvider && phoneMFAIsEnabled && (
                    <Alert_Shadcn_ variant="warning">
                      <WarningIcon />
                      <AlertTitle_Shadcn_>
                        Please configure a valid phone provider. Only Twilio, Vonage, and Send SMS
                        Hooks are supported at this time.
                      </AlertTitle_Shadcn_>
                    </Alert_Shadcn_>
                  )}

                  <InputNumber
                    id="MFA_PHONE_OTP_LENGTH"
                    size="small"
                    label="Phone OTP Length"
                    descriptionText="Number of digits in OTP"
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                  <FormField
                    name="MFA_PHONE_TEMPLATE"
                    properties={{
                      title: 'Phone verification message',
                      type: 'multiline-string',
                      description: 'To format the OTP code use `{{ .Code }}`',
                    }}
                    formValues={values}
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                  {hasUpgradedPhoneMFA && (
                    <Alert_Shadcn_ variant="warning">
                      <WarningIcon />
                      <AlertTitle_Shadcn_>
                        Enabling advanced MFA with phone will result in an additional charge of $75
                        per month for the first project in the organization and an additional $10
                        per month for additional projects.
                      </AlertTitle_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                </FormSectionContent>
              </FormSection>

              <FormSection
                header={<FormSectionLabel>Max Direct Database Connections</FormSectionLabel>}
              >
                <FormSectionContent loading={isLoading}>
                  {promptTeamsEnterpriseUpgrade && (
                    <UpgradeToPro
                      primaryText="Upgrade to Team or Enterprise"
                      secondaryText="Max Direct Database Connections settings are only available on the Team Plan and up."
                      buttonText="Upgrade to Team"
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
                      primaryText="Upgrade to Team or Enterprise"
                      secondaryText="Max Request Duration settings are only available on the Team Plan and up."
                      buttonText="Upgrade to Team"
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
