import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from 'lib/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
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
  PrePostTab,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
  WarningIcon,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { boolean, number, object, string } from 'yup'

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

const securitySchema = object({
  MFA_ALLOW_LOW_AAL: boolean().required(),
})

export const MfaAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()

  // Separate loading states for each form
  const [isUpdatingTotpForm, setIsUpdatingTotpForm] = useState(false)
  const [isUpdatingPhoneForm, setIsUpdatingPhoneForm] = useState(false)
  const [isUpdatingSecurityForm, setIsUpdatingSecurityForm] = useState(false)

  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)

  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { hasAccess: hasAccessToMFAEntitlement, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('auth.mfa_phone')
  const hasAccessToMFA = !IS_PLATFORM || hasAccessToMFAEntitlement
  const promptProPlanUpgrade = IS_PLATFORM && !hasAccessToMFAEntitlement

  const {
    hasAccess: hasAccessToEnhanceSecurityEntitlement,
    isLoading: isLoadingEntitlementEnhanceSecurity,
  } = useCheckEntitlements('auth.mfa_enhanced_security')
  const hasAccessToEnhanceSecurity = !IS_PLATFORM || hasAccessToEnhanceSecurityEntitlement
  const promptEnhancedSecurityUpgrade = IS_PLATFORM && !hasAccessToEnhanceSecurityEntitlement

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

  const securityForm = useForm({
    resolver: yupResolver(securitySchema),
    defaultValues: {
      MFA_ALLOW_LOW_AAL: false,
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

      if (!isUpdatingSecurityForm) {
        securityForm.reset({
          MFA_ALLOW_LOW_AAL: authConfig?.MFA_ALLOW_LOW_AAL ?? true,
        })
      }
    }
  }, [authConfig, isUpdatingTotpForm, isUpdatingPhoneForm, isUpdatingSecurityForm])

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

  const onSubmitSecurityForm = (values: any) => {
    const payload = { ...values }

    setIsUpdatingSecurityForm(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update phone MFA settings: ${error?.message}`)
          setIsUpdatingSecurityForm(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated phone MFA settings')
          setIsUpdatingSecurityForm(false)
        },
      }
    )
  }

  const onSubmitPhoneForm = (values: any) => {
    let payload = { ...values }

    if (hasAccessToMFA) {
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
      <PageSection>
        <PageSectionContent>
          <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (!canReadConfig) {
    return (
      <PageSection>
        <PageSectionContent>
          <NoPermission resourceText="view auth configuration settings" />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (isLoading || isLoadingEntitlement || isLoadingEntitlementEnhanceSecurity) {
    return (
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    )
  }

  const phoneMFAIsEnabled =
    phoneForm.watch('MFA_PHONE') === 'Enabled' || phoneForm.watch('MFA_PHONE') === 'Verify Enabled'
  const hasUpgradedPhoneMFA =
    authConfig && !authConfig.MFA_PHONE_VERIFY_ENABLED && phoneMFAIsEnabled

  const maybeConfirmPhoneMFAOrSubmit = () => {
    if (hasUpgradedPhoneMFA) {
      setIsConfirmationModalVisible(true)
    } else {
      phoneForm.handleSubmit(onSubmitPhoneForm)()
    }
  }

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Multi-Factor Authentication (MFA)</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form_Shadcn_ {...totpForm}>
            <form onSubmit={totpForm.handleSubmit(onSubmitTotpForm)} className="space-y-4">
              <Card>
                <CardContent>
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
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>SMS MFA</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form_Shadcn_ {...phoneForm}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                maybeConfirmPhoneMFAOrSubmit()
              }}
            >
              <Card>
                <CardContent>
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
                            disabled={!canUpdateConfig || !hasAccessToMFA}
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
                            disabled={!canUpdateConfig || !hasAccessToMFA}
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
                            disabled={!canUpdateConfig || !hasAccessToMFA}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {promptProPlanUpgrade && (
                  <UpgradeToPro
                    fullWidth
                    source="authSmsMfa"
                    featureProposition="configure settings for SMS MFA"
                    primaryText="SMS MFA is only available on the Pro Plan and above"
                    secondaryText="Upgrade to the Pro plan to configure settings for SMS MFA."
                  />
                )}

                <CardFooter className="justify-end space-x-2">
                  {phoneForm.formState.isDirty && (
                    <Button type="default" onClick={() => phoneForm.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type={promptProPlanUpgrade ? 'default' : 'primary'}
                    htmlType="submit"
                    disabled={
                      !canUpdateConfig ||
                      isUpdatingPhoneForm ||
                      !phoneForm.formState.isDirty ||
                      !hasAccessToMFA
                    }
                    loading={isUpdatingPhoneForm}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        </PageSectionContent>
      </PageSection>

      <ConfirmationModal
        visible={isConfirmationModalVisible}
        title="Confirm SMS MFA"
        confirmLabel="Confirm and save"
        onCancel={() => setIsConfirmationModalVisible(false)}
        onConfirm={() => {
          setIsConfirmationModalVisible(false)
          phoneForm.handleSubmit(onSubmitPhoneForm)()
        }}
        variant="warning"
      >
        Enabling SMS MFA will result in an additional charge of <span translate="no">$75</span> per
        month for the first project in the organization and an additional{' '}
        <span translate="no">$10</span> per month for additional projects.
        <p className="mt-2">
          Billing will start immediately upon enabling this add-on, regardless of whether your
          customers are using SMS MFA.
        </p>
      </ConfirmationModal>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Enhanced MFA Security</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form_Shadcn_ {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSubmitSecurityForm)}>
              <Card>
                <CardContent>
                  <FormField_Shadcn_
                    control={securityForm.control}
                    name="MFA_ALLOW_LOW_AAL"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Limit duration of AAL1 sessions"
                        description="A user's session will be terminated unless they verify one of their factors within 15 minutes of initial sign in. Recommendation: ON"
                      >
                        <FormControl_Shadcn_>
                          <Switch
                            checked={!field.value}
                            onCheckedChange={(value) => field.onChange(!value)}
                            disabled={!canUpdateConfig || !hasAccessToEnhanceSecurity}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {promptEnhancedSecurityUpgrade && (
                  <UpgradeToPro
                    fullWidth
                    source="authEnhancedSecurity"
                    featureProposition="configure settings for Enhanced MFA Security"
                    primaryText="Enhanced MFA Security is not available on your plan"
                    secondaryText="Upgrade your plan to configure settings for Enhanced MFA Security"
                    buttonText="Upgrade"
                  />
                )}
                <CardFooter className="justify-end space-x-2">
                  {securityForm.formState.isDirty && (
                    <Button type="default" onClick={() => securityForm.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={
                      !canUpdateConfig || isUpdatingSecurityForm || !securityForm.formState.isDirty
                    }
                    loading={isUpdatingPhoneForm}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        </PageSectionContent>
      </PageSection>
    </>
  )
}
