import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { number, object, string } from 'yup'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
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
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
  PrePostTab,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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

const totpSchema = object({
  MFA_TOTP: string().required(),
  MFA_MAX_ENROLLED_FACTORS: number()
    .min(0, 'Must be a value 0 or larger')
    .max(30, 'Must be a value no greater than 30'),
})

const phoneSchema = object({
  MFA_PHONE: string().required(),
  MFA_PHONE_OTP_LENGTH: number()
    .min(6, 'Must be a value 6 or larger')
    .max(30, 'must be a value no greater than 30'),
  MFA_PHONE_TEMPLATE: string().required('SMS template is required.'),
})

const MfaAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()

  // Separate loading states for each form
  const [isUpdatingTotpForm, setIsUpdatingTotpForm] = useState(false)
  const [isUpdatingPhoneForm, setIsUpdatingPhoneForm] = useState(false)

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

  // For now, we support Twilio and Vonage. Twilio Verify is not supported and the remaining providers are community maintained.
  const sendSMSHookIsEnabled =
    authConfig?.HOOK_SEND_SMS_URI !== null && authConfig?.HOOK_SEND_SMS_ENABLED === true
  const hasValidMFAPhoneProvider = authConfig?.EXTERNAL_PHONE_ENABLED === true
  const hasValidMFAProvider = hasValidMFAPhoneProvider || sendSMSHookIsEnabled

  const totpForm = useForm({
    resolver: yupResolver(totpSchema),
    defaultValues: {
      MFA_TOTP: 'Enabled',
      MFA_MAX_ENROLLED_FACTORS: 10,
    },
  })

  const phoneForm = useForm({
    resolver: yupResolver(phoneSchema),
    defaultValues: {
      MFA_PHONE: 'Disabled',
      MFA_PHONE_OTP_LENGTH: 6,
      MFA_PHONE_TEMPLATE: 'Your code is {{ .Code }}',
    },
  })

  useEffect(() => {
    if (authConfig) {
      if (!isUpdatingTotpForm) {
        totpForm.reset({
          MFA_TOTP:
            determineMFAStatus(
              authConfig?.MFA_TOTP_VERIFY_ENABLED ?? true,
              authConfig?.MFA_TOTP_ENROLL_ENABLED ?? true
            ) || 'Enabled',
          MFA_MAX_ENROLLED_FACTORS: authConfig?.MFA_MAX_ENROLLED_FACTORS ?? 10,
        })
      }

      if (!isUpdatingPhoneForm) {
        phoneForm.reset({
          MFA_PHONE:
            determineMFAStatus(
              authConfig?.MFA_PHONE_VERIFY_ENABLED || false,
              authConfig?.MFA_PHONE_ENROLL_ENABLED || false
            ) || 'Disabled',
          MFA_PHONE_OTP_LENGTH: authConfig?.MFA_PHONE_OTP_LENGTH || 6,
          MFA_PHONE_TEMPLATE: authConfig?.MFA_PHONE_TEMPLATE || 'Your code is {{ .Code }}',
        })
      }
    }
  }, [authConfig, isUpdatingTotpForm, isUpdatingPhoneForm])

  const onSubmitTotpForm = (values: any) => {
    const { verifyEnabled: MFA_TOTP_VERIFY_ENABLED, enrollEnabled: MFA_TOTP_ENROLL_ENABLED } =
      MfaStatusToState(values.MFA_TOTP)

    const payload = {
      ...values,
      MFA_TOTP_ENROLL_ENABLED,
      MFA_TOTP_VERIFY_ENABLED,
    }
    delete payload.MFA_TOTP

    setIsUpdatingTotpForm(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update TOTP settings: ${error?.message}`)
          setIsUpdatingTotpForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated TOTP settings')
          setIsUpdatingTotpForm(false)
        },
      }
    )
  }

  const onSubmitPhoneForm = (values: any) => {
    let payload = { ...values }

    if (isProPlanAndUp) {
      const { verifyEnabled: MFA_PHONE_VERIFY_ENABLED, enrollEnabled: MFA_PHONE_ENROLL_ENABLED } =
        MfaStatusToState(values.MFA_PHONE)
      payload = {
        ...payload,
        MFA_PHONE_ENROLL_ENABLED,
        MFA_PHONE_VERIFY_ENABLED,
      }
    }
    delete payload.MFA_PHONE

    setIsUpdatingPhoneForm(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update phone MFA settings: ${error?.message}`)
          setIsUpdatingPhoneForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated phone MFA settings')
          setIsUpdatingPhoneForm(false)
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

  const phoneMFAIsEnabled =
    phoneForm.watch('MFA_PHONE') === 'Enabled' || phoneForm.watch('MFA_PHONE') === 'Verify Enabled'
  const hasUpgradedPhoneMFA = authConfig?.MFA_PHONE_VERIFY_ENABLED === false && phoneMFAIsEnabled

  return (
    <>
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">
          Multi-Factor Authentication (MFA)
        </ScaffoldSectionTitle>

        <Form_Shadcn_ {...totpForm}>
          <form onSubmit={totpForm.handleSubmit(onSubmitTotpForm)} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <FormField_Shadcn_
                  control={totpForm.control}
                  name="MFA_TOTP"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="TOTP (App Authenticator)"
                      description="Control use of TOTP (App Authenticator) factors"
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!canUpdateConfig}
                        >
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select status" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {MFAFactorSelectionOptions.map((option) => (
                              <SelectItem_Shadcn_ key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardContent>
                <FormField_Shadcn_
                  control={totpForm.control}
                  name="MFA_MAX_ENROLLED_FACTORS"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Maximum number of per-user MFA factors"
                      description="How many MFA factors can be enrolled at once per user."
                    >
                      <FormControl_Shadcn_>
                        <PrePostTab postTab="factors">
                          <Input_Shadcn_
                            type="number"
                            min={0}
                            max={30}
                            {...field}
                            disabled={!canUpdateConfig}
                          />
                        </PrePostTab>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {totpForm.formState.isDirty && (
                  <Button type="default" onClick={() => totpForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!canUpdateConfig || isUpdatingTotpForm || !totpForm.formState.isDirty}
                  loading={isUpdatingTotpForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>

      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">SMS MFA</ScaffoldSectionTitle>

        <Form_Shadcn_ {...phoneForm}>
          <form onSubmit={phoneForm.handleSubmit(onSubmitPhoneForm)} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {promptProPlanUpgrade && (
                  <div className="mb-4">
                    <UpgradeToPro
                      primaryText="Upgrade to Pro"
                      secondaryText="Advanced MFA requires the Pro Plan"
                    />
                  </div>
                )}

                <FormField_Shadcn_
                  control={phoneForm.control}
                  name="MFA_PHONE"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Phone"
                      description="Control use of phone factors"
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!canUpdateConfig || !isProPlanAndUp}
                        >
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select status" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {MFAFactorSelectionOptions.map((option) => (
                              <SelectItem_Shadcn_ key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {!hasValidMFAProvider && phoneMFAIsEnabled && (
                  <Alert_Shadcn_ variant="warning" className="mt-3">
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      To use MFA with Phone you should set up a Phone provider or Send SMS Hook.
                    </AlertTitle_Shadcn_>
                  </Alert_Shadcn_>
                )}
              </CardContent>

              <CardContent>
                <FormField_Shadcn_
                  control={phoneForm.control}
                  name="MFA_PHONE_OTP_LENGTH"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Phone OTP Length"
                      description="Number of digits in OTP"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="number"
                          min={6}
                          max={30}
                          {...field}
                          disabled={!canUpdateConfig || !isProPlanAndUp}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardContent>
                <FormField_Shadcn_
                  control={phoneForm.control}
                  name="MFA_PHONE_TEMPLATE"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Phone verification message"
                      description="To format the OTP code use `{{ .Code }}`"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="text"
                          {...field}
                          disabled={!canUpdateConfig || !isProPlanAndUp}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              {hasUpgradedPhoneMFA && (
                <CardContent>
                  <Alert_Shadcn_ variant="warning">
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      Enabling advanced MFA with phone will result in an additional charge of $75
                      per month for the first project in the organization and an additional $10 per
                      month for additional projects.
                    </AlertTitle_Shadcn_>
                  </Alert_Shadcn_>
                </CardContent>
              )}

              <CardFooter className="justify-end space-x-2">
                {phoneForm.formState.isDirty && (
                  <Button type="default" onClick={() => phoneForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !canUpdateConfig ||
                    isUpdatingPhoneForm ||
                    !phoneForm.formState.isDirty ||
                    !isProPlanAndUp
                  }
                  loading={isUpdatingPhoneForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>
    </>
  )
}

export default MfaAuthSettingsForm
