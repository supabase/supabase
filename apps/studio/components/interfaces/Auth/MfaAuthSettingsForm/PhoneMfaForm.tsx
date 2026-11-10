import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useState } from 'react'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  WarningIcon,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import {
  determineMFAStatus,
  MFAFactorSelectionOptions,
  MfaStatusToState,
} from './MfaAuthSettingsForm.utils'
import { TaxDisclaimer } from '@/components/interfaces/Billing/TaxDisclaimer'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { ProjectAuthConfigData } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { preprocessEmptyNumberInput } from '@/lib/forms/zod-number-input'

const phoneSchema = z.object({
  MFA_PHONE: z.string().min(1, 'Required'),
  MFA_PHONE_OTP_LENGTH: preprocessEmptyNumberInput(
    z.coerce
      .number({ required_error: 'Required', invalid_type_error: 'Required' })
      .min(6, 'Must be a value 6 or larger')
      .max(30, 'must be a value no greater than 30')
  ),
  MFA_PHONE_TEMPLATE: z.string().min(1, 'Required'),
})

type PhoneFormValues = z.infer<typeof phoneSchema>

interface PhoneMfaFormProps {
  authConfig: ProjectAuthConfigData
  canUpdateConfig: boolean
  hasAccessToMFA: boolean
  promptProPlanUpgrade: boolean
  isBranch: boolean
}

export const PhoneMfaForm = ({
  authConfig,
  canUpdateConfig,
  hasAccessToMFA,
  promptProPlanUpgrade,
  isBranch,
}: PhoneMfaFormProps) => {
  const { ref: projectRef } = useParams()
  const { mutate: updateAuthConfig, isPending: isUpdatingPhoneForm } = useAuthConfigUpdateMutation()
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)

  // For now, we support Twilio and Vonage. Twilio Verify is not supported and the remaining providers are community maintained.
  const sendSMSHookIsEnabled =
    authConfig?.HOOK_SEND_SMS_URI !== null && authConfig?.HOOK_SEND_SMS_ENABLED === true
  const hasValidMFAPhoneProvider = authConfig?.EXTERNAL_PHONE_ENABLED === true
  const hasValidMFAProvider = hasValidMFAPhoneProvider || sendSMSHookIsEnabled

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      MFA_PHONE: determineMFAStatus(
        authConfig.MFA_PHONE_VERIFY_ENABLED || false,
        authConfig.MFA_PHONE_ENROLL_ENABLED || false
      ),
      MFA_PHONE_OTP_LENGTH: authConfig.MFA_PHONE_OTP_LENGTH || 6,
      MFA_PHONE_TEMPLATE: authConfig.MFA_PHONE_TEMPLATE || 'Your code is {{ .Code }}',
    },
  })
  const mfaPhoneValue = useWatch({ control: phoneForm.control, name: 'MFA_PHONE' })

  const onSubmitPhoneForm: SubmitHandler<PhoneFormValues> = (values) => {
    let payload: Record<string, string | number | boolean> = {
      MFA_PHONE_OTP_LENGTH: values.MFA_PHONE_OTP_LENGTH,
      MFA_PHONE_TEMPLATE: values.MFA_PHONE_TEMPLATE,
    }

    if (hasAccessToMFA) {
      const { verifyEnabled: MFA_PHONE_VERIFY_ENABLED, enrollEnabled: MFA_PHONE_ENROLL_ENABLED } =
        MfaStatusToState(values.MFA_PHONE)
      payload = {
        MFA_PHONE_OTP_LENGTH: values.MFA_PHONE_OTP_LENGTH,
        MFA_PHONE_TEMPLATE: values.MFA_PHONE_TEMPLATE,
        MFA_PHONE_ENROLL_ENABLED,
        MFA_PHONE_VERIFY_ENABLED,
      }
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update phone MFA settings: ${error?.message}`)
        },
        onSuccess: () => {
          toast.success('Successfully updated phone MFA settings')
          phoneForm.reset(values)
        },
      }
    )
  }

  const phoneMFAIsEnabled = mfaPhoneValue === 'Enabled' || mfaPhoneValue === 'Verify Enabled'
  const hasUpgradedPhoneMFA =
    authConfig && !authConfig.MFA_PHONE_VERIFY_ENABLED && phoneMFAIsEnabled

  // Auth add-ons aren't charged for on branches, so there's no price increase to confirm
  const shouldConfirmPhoneMFACharge = hasUpgradedPhoneMFA && !isBranch

  const maybeConfirmPhoneMFAOrSubmit = () => {
    if (shouldConfirmPhoneMFACharge) {
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
            <PageSectionTitle>SMS MFA</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form {...phoneForm}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                maybeConfirmPhoneMFAOrSubmit()
              }}
            >
              <Card>
                <CardContent>
                  <FormField
                    control={phoneForm.control}
                    name="MFA_PHONE"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Phone"
                        description="Control use of phone factors"
                      >
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!canUpdateConfig || !hasAccessToMFA}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {MFAFactorSelectionOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />

                  {!hasValidMFAProvider && phoneMFAIsEnabled && (
                    <Alert variant="warning" className="mt-3">
                      <WarningIcon />
                      <AlertTitle>
                        To use MFA with Phone you should set up a Phone provider or Send SMS Hook.
                      </AlertTitle>
                    </Alert>
                  )}
                </CardContent>

                <CardContent>
                  <FormField
                    control={phoneForm.control}
                    name="MFA_PHONE_OTP_LENGTH"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Phone OTP Length"
                        description="Number of digits in OTP"
                      >
                        <FormControl>
                          <InputGroup>
                            <FormInputGroupInput
                              type="number"
                              min={6}
                              max={30}
                              {...field}
                              disabled={!canUpdateConfig || !hasAccessToMFA}
                              data-1p-ignore // 1Password
                              data-lpignore="true" // LastPass
                              data-form-type="other" // Dashlane
                              data-bwignore // Bitwarden
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>digits</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardContent>
                  <FormField
                    control={phoneForm.control}
                    name="MFA_PHONE_TEMPLATE"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Phone verification message"
                        description="To format the OTP code use `{{ .Code }}`"
                      >
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            disabled={!canUpdateConfig || !hasAccessToMFA}
                            data-1p-ignore // 1Password
                            data-lpignore="true" // LastPass
                            data-form-type="other" // Dashlane
                            data-bwignore // Bitwarden
                          />
                        </FormControl>
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
                    <Button onClick={() => phoneForm.reset()}>Cancel</Button>
                  )}
                  <Button
                    variant={promptProPlanUpgrade ? 'default' : 'primary'}
                    type="submit"
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
          </Form>
        </PageSectionContent>
      </PageSection>

      <ConfirmationModal
        visible={isConfirmationModalVisible}
        variant="warning"
        title="Confirm SMS MFA"
        confirmLabel="Confirm and save"
        className="text-sm"
        onCancel={() => setIsConfirmationModalVisible(false)}
        onConfirm={() => {
          setIsConfirmationModalVisible(false)
          phoneForm.handleSubmit(onSubmitPhoneForm)()
        }}
      >
        Enabling SMS MFA will result in an additional charge of <span translate="no">$75</span> per
        month for the first project in the organization and an additional{' '}
        <span translate="no">$10</span> per month for additional projects.
        <p className="mt-2">
          Billing will start immediately upon enabling this add-on, regardless of whether your
          customers are using SMS MFA.
        </p>
        <TaxDisclaimer className="mt-2" />
      </ConfirmationModal>
    </>
  )
}
