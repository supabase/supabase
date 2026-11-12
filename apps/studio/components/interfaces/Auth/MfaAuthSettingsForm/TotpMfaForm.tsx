import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
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
import { ProjectAuthConfigData } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { preprocessEmptyNumberInput } from '@/lib/forms/zod-number-input'

const totpSchema = z.object({
  MFA_TOTP: z.string().min(1, 'Required'),
  MFA_MAX_ENROLLED_FACTORS: preprocessEmptyNumberInput(
    z.coerce
      .number({ required_error: 'Required', invalid_type_error: 'Required' })
      .min(0, 'Must be a value 0 or larger')
      .max(30, 'Must be a value no greater than 30')
  ),
})

type TotpFormValues = z.infer<typeof totpSchema>

interface TotpMfaFormProps {
  authConfig: ProjectAuthConfigData
  canUpdateConfig: boolean
}

export const TotpMfaForm = ({ authConfig, canUpdateConfig }: TotpMfaFormProps) => {
  const { ref: projectRef } = useParams()
  const { mutate: updateAuthConfig, isPending: isUpdatingTotpForm } = useAuthConfigUpdateMutation()

  const totpForm = useForm<TotpFormValues>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      MFA_TOTP: determineMFAStatus(
        authConfig.MFA_TOTP_VERIFY_ENABLED ?? true,
        authConfig.MFA_TOTP_ENROLL_ENABLED ?? true
      ),
      MFA_MAX_ENROLLED_FACTORS: authConfig.MFA_MAX_ENROLLED_FACTORS ?? 10,
    },
  })
  const { isDirty } = totpForm.formState

  const onSubmitTotpForm: SubmitHandler<TotpFormValues> = (values) => {
    const { verifyEnabled: MFA_TOTP_VERIFY_ENABLED, enrollEnabled: MFA_TOTP_ENROLL_ENABLED } =
      MfaStatusToState(values.MFA_TOTP)

    const payload = {
      MFA_MAX_ENROLLED_FACTORS: values.MFA_MAX_ENROLLED_FACTORS,
      MFA_TOTP_ENROLL_ENABLED,
      MFA_TOTP_VERIFY_ENABLED,
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update TOTP settings: ${error?.message}`)
        },
        onSuccess: () => {
          toast.success('Successfully updated TOTP settings')
          totpForm.reset(values)
        },
      }
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Multi-Factor Authentication (MFA)</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form {...totpForm}>
          <form onSubmit={totpForm.handleSubmit(onSubmitTotpForm)} className="space-y-4">
            <Card>
              <CardContent>
                <FormField
                  control={totpForm.control}
                  name="MFA_TOTP"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="TOTP (App Authenticator)"
                      description="Control use of TOTP (App Authenticator) factors"
                    >
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!canUpdateConfig}
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
              </CardContent>

              <CardContent>
                <FormField
                  control={totpForm.control}
                  name="MFA_MAX_ENROLLED_FACTORS"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Maximum number of per-user MFA factors"
                      description="How many MFA factors can be enrolled at once per user."
                    >
                      <FormControl>
                        <InputGroup>
                          <FormInputGroupInput
                            type="number"
                            min={0}
                            max={30}
                            {...field}
                            disabled={!canUpdateConfig}
                            data-1p-ignore // 1Password
                            data-lpignore="true" // LastPass
                            data-form-type="other" // Dashlane
                            data-bwignore // Bitwarden
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>factors</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {isDirty && <Button onClick={() => totpForm.reset()}>Cancel</Button>}
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!canUpdateConfig || isUpdatingTotpForm || !isDirty}
                  loading={isUpdatingTotpForm}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </PageSectionContent>
    </PageSection>
  )
}
