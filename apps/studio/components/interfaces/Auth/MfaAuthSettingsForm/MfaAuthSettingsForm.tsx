import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { number, object, string } from 'yup'

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
  WarningIcon,
} from 'ui'

const schema = object({
  MFA_PHONE_OTP_LENGTH: number()
    .min(6, 'Must be a value 6 or larger')
    .max(30, 'must be a value no greater than 30'),
  MFA_PHONE_TEMPLATE: string().required('SMS template is required.'),
  MFA_MAX_ENROLLED_FACTORS: number()
    .min(0, 'Must be be a value more than 0')
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

const MfaAuthSettingsForm = () => {
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

  const isProPlanAndUp = isSuccessSubscription && subscription?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const projectAddons = subscription?.project_addons.find((addon) => addon.ref === projectRef)
  const hasPurchasedAuthMFAAddOn = projectAddons?.addons.some(
    (addon) => addon.type === 'auth_mfa_phone'
  )

  const INITIAL_VALUES = {
    MFA_PHONE_OTP_LENGTH: authConfig?.MFA_PHONE_OTP_LENGTH || 6,
    MFA_PHONE_TEMPLATE: authConfig?.MFA_PHONE_TEMPLATE || 'Your code is {{ .Code }}',
    MFA_MAX_ENROLLED_FACTORS: authConfig?.MFA_MAX_ENROLLED_FACTORS || 10,
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
  const hasValidMFAPhoneProvider = authConfig?.EXTERNAL_PHONE_ENABLED === true
  const hasValidMFAProvider = hasValidMFAPhoneProvider || sendSMSHookIsEnabled

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
      {({ handleReset, resetForm, values, initialValues, setFieldValue }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        // Form is reset once remote data is loaded in store
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (isSuccess) resetForm({ values: INITIAL_VALUES, initialValues: INITIAL_VALUES })
        }, [isSuccess])

        const hasUpgradedPhoneMFA =
          INITIAL_VALUES.MFA_PHONE === 'Disabled' && values.MFA_PHONE !== INITIAL_VALUES.MFA_PHONE
        const phoneMFAIsEnabled =
          values.MFA_PHONE === 'Enabled' || values.MFA_PHONE === 'Verify Enabled'

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
                    setFieldValue={setFieldValue}
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
              <FormSection header={<FormSectionLabel>SMS MFA</FormSectionLabel>}>
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
                    setFieldValue={setFieldValue}
                  />
                  {!hasValidMFAProvider && phoneMFAIsEnabled && (
                    <Alert_Shadcn_ variant="warning">
                      <WarningIcon />
                      <AlertTitle_Shadcn_>
                        To use MFA with Phone you should set up a Phone provider or Send SMS Hook.
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
                    setFieldValue={setFieldValue}
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
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default MfaAuthSettingsForm
