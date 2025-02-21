import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { StringNumberOrNull } from 'components/ui/Forms/Form.constants'
import { FormActions } from 'components/ui/Forms/FormActions'
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
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const formId = 'auth-config-advanced-form'

const FormSchema = z.object({
  API_MAX_REQUEST_DURATION: z.coerce
    .number()
    .min(5, 'Must be 5 or larger')
    .max(30, 'Must be a value no greater than 30'),
  DB_MAX_POOL_SIZE: StringNumberOrNull,
})

export const AdvancedAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })

  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const defaultValues = useMemo(
    () => ({
      API_MAX_REQUEST_DURATION: authConfig?.API_MAX_REQUEST_DURATION ?? undefined,
      DB_MAX_POOL_SIZE: authConfig?.DB_MAX_POOL_SIZE ?? '',
    }),
    [authConfig]
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: defaultValues as any,
  })
  const { isDirty } = form.formState

  const isTeamsEnterprisePlan =
    isSuccessSubscription && subscription.plan.id !== 'free' && subscription.plan.id !== 'pro'
  const promptTeamsEnterpriseUpgrade =
    IS_PLATFORM && isSuccessSubscription && !isTeamsEnterprisePlan

  const resetForm = () => {
    form.reset(defaultValues as any)
  }

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = (data) => {
    if (!projectRef) return console.error('Project ref is required')

    const { API_MAX_REQUEST_DURATION, DB_MAX_POOL_SIZE, ...config } = data
    const payload = {
      ...config,
      ...(isTeamsEnterprisePlan ? { API_MAX_REQUEST_DURATION } : {}),
      DB_MAX_POOL_SIZE,
    }

    updateAuthConfig(
      // @ts-expect-error
      { projectRef: projectRef, config: payload },
      {
        onSuccess: () => {
          toast.success('Successfully updated settings')
          form.reset({ ...defaultValues, ...data })
        },
      }
    )
  }

  useEffect(() => {
    // reset form with the current values
    if (isSuccess) resetForm()
  }, [defaultValues, isSuccess])

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
    <>
      {promptTeamsEnterpriseUpgrade && (
        <UpgradeToPro
          primaryText="Upgrade to Team or Enterprise"
          secondaryText="Advanced Auth server settings are only available on the Team Plan and up."
          buttonText="Upgrade to Team"
        />
      )}
      <Form_Shadcn_ {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          <FormPanel
            footer={
              <div className="flex py-4 px-8">
                <FormActions
                  form={formId}
                  isSubmitting={isUpdatingConfig}
                  hasChanges={isDirty}
                  handleReset={() => resetForm()}
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
                <FormField_Shadcn_
                  control={form.control}
                  name="API_MAX_REQUEST_DURATION"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Maximum time allowed for an Auth request to last"
                      description="Number of seconds to wait for an Auth request to complete before canceling it. In certain high-load situations setting a larger or smaller value can be used to control load-shedding. Recommended: 10 seconds."
                    >
                      <FormControl_Shadcn_>
                        <div className="relative">
                          <Input_Shadcn_
                            type="number"
                            disabled={!canUpdateConfig || promptTeamsEnterpriseUpgrade}
                            placeholder="10"
                            {...field}
                          />
                          <span className="text-sm text-foreground-lighter absolute top-1.5 right-3">
                            seconds
                          </span>
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </FormSectionContent>
            </FormSection>

            <FormSection header={<FormSectionLabel>Auth Database Connections</FormSectionLabel>}>
              <FormSectionContent loading={isLoading}>
                <FormField_Shadcn_
                  control={form.control}
                  name="DB_MAX_POOL_SIZE"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Max Direct Auth Connections"
                      description="Auth will take up no more than this number of connections from the total number of available connections to serve requests. These connections are not reserved, so when unused they are released. Defaults to 10 connections."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          type="number"
                          disabled={!canUpdateConfig || promptTeamsEnterpriseUpgrade}
                          placeholder="10"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </FormSectionContent>
            </FormSection>
          </FormPanel>
        </form>
      </Form_Shadcn_>
    </>
  )
}
