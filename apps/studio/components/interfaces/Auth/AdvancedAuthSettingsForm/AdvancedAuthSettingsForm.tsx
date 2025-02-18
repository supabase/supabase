import { PermissionAction } from '@supabase/shared-types/out/constants'
import { toast } from 'sonner'
import { number, object } from 'yup'

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

import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Form,
  InputNumber,
  WarningIcon,
} from 'ui'

const schema = object({
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
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })

  const isTeamsEnterprisePlan =
    isSuccessSubscription && subscription.plan.id !== 'free' && subscription.plan.id !== 'pro'
  const promptTeamsEnterpriseUpgrade = IS_PLATFORM && !isTeamsEnterprisePlan

  const INITIAL_VALUES = {
    API_MAX_REQUEST_DURATION: authConfig?.API_MAX_REQUEST_DURATION || 10,
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }

    if (!isTeamsEnterprisePlan) {
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
      {({ handleReset, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

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
