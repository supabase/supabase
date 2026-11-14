import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, CardFooter, Form, FormControl, FormField, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { ProjectAuthConfigData } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'

const securitySchema = z.object({
  MFA_ALLOW_LOW_AAL: z.boolean({ required_error: 'Required' }),
})

type SecurityFormValues = z.infer<typeof securitySchema>

interface EnhancedMfaSecurityFormProps {
  authConfig: ProjectAuthConfigData
  canUpdateConfig: boolean
  hasAccessToEnhanceSecurity: boolean
  promptEnhancedSecurityUpgrade: boolean
}

export const EnhancedMfaSecurityForm = ({
  authConfig,
  canUpdateConfig,
  hasAccessToEnhanceSecurity,
  promptEnhancedSecurityUpgrade,
}: EnhancedMfaSecurityFormProps) => {
  const { ref: projectRef } = useParams()
  const { mutate: updateAuthConfig, isPending: isUpdatingSecurityForm } =
    useAuthConfigUpdateMutation()

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      MFA_ALLOW_LOW_AAL: authConfig.MFA_ALLOW_LOW_AAL ?? true,
    },
  })

  const onSubmitSecurityForm: SubmitHandler<SecurityFormValues> = (values) => {
    updateAuthConfig(
      { projectRef: projectRef!, config: values },
      {
        onError: (error) => {
          toast.error(`Failed to update enhanced MFA security settings: ${error?.message}`)
        },
        onSuccess: () => {
          toast.success('Successfully updated enhanced MFA security settings')
          securityForm.reset(values)
        },
      }
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Enhanced MFA Security</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form {...securityForm}>
          <form onSubmit={securityForm.handleSubmit(onSubmitSecurityForm)}>
            <Card>
              <CardContent>
                <FormField
                  control={securityForm.control}
                  name="MFA_ALLOW_LOW_AAL"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Limit duration of AAL1 sessions"
                      description="A user's session will be terminated unless they verify one of their factors within 15 minutes of initial sign in. Recommendation: ON"
                    >
                      <FormControl>
                        <Switch
                          checked={!field.value}
                          onCheckedChange={(value) => field.onChange(!value)}
                          disabled={!canUpdateConfig || !hasAccessToEnhanceSecurity}
                        />
                      </FormControl>
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
                  <Button onClick={() => securityForm.reset()}>Cancel</Button>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    !canUpdateConfig || isUpdatingSecurityForm || !securityForm.formState.isDirty
                  }
                  loading={isUpdatingSecurityForm}
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
