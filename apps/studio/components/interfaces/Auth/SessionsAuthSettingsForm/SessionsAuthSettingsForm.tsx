import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { boolean, number, object } from 'yup'

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
  Toggle,
  WarningIcon,
} from 'ui'

function HoursOrNeverText({ value }: { value: number }) {
  if (value === 0) {
    return 'never'
  } else if (value === 1) {
    return 'hour'
  } else {
    return 'hours'
  }
}

const schema = object({
  REFRESH_TOKEN_ROTATION_ENABLED: boolean().required(),
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: number()
    .min(0, 'Must be a value more than 0')
    .required('Must have a Reuse Interval value'),
  SESSIONS_TIMEBOX: number().min(0, 'Must be a positive number'),
  SESSIONS_INACTIVITY_TIMEOUT: number().min(0, 'Must be a positive number'),
  SESSIONS_SINGLE_PER_USER: boolean(),
})

const SessionsAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const formId = 'auth-config-sessions-form'
  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })

  const isProPlanAndUp = isSuccessSubscription && subscription?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const INITIAL_VALUES = {
    REFRESH_TOKEN_ROTATION_ENABLED: authConfig?.REFRESH_TOKEN_ROTATION_ENABLED || false,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
    SESSIONS_TIMEBOX: authConfig?.SESSIONS_TIMEBOX || 0,
    SESSIONS_INACTIVITY_TIMEOUT: authConfig?.SESSIONS_INACTIVITY_TIMEOUT || 0,
    SESSIONS_SINGLE_PER_USER: authConfig?.SESSIONS_SINGLE_PER_USER || false,
  }

  const onSubmit = (values: any, { resetForm }: any) => {
    const payload = { ...values }

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
              <FormSection header={<FormSectionLabel>Refresh Tokens</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  <Toggle
                    id="REFRESH_TOKEN_ROTATION_ENABLED"
                    size="small"
                    label="Detect and revoke potentially compromised refresh tokens"
                    layout="flex"
                    descriptionText="Prevent replay attacks from potentially compromised refresh tokens."
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

              <FormSection header={<FormSectionLabel>User Sessions</FormSectionLabel>}>
                <FormSectionContent loading={isLoading}>
                  {promptProPlanUpgrade && (
                    <UpgradeToPro
                      primaryText="Upgrade to Pro"
                      secondaryText="Configuring user sessions requires the Pro Plan."
                    />
                  )}
                  <Toggle
                    id="SESSIONS_SINGLE_PER_USER"
                    size="small"
                    label="Enforce single session per user"
                    layout="flex"
                    descriptionText="If enabled, all but a user's most recently active session will be terminated."
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                  <InputNumber
                    id="SESSIONS_TIMEBOX"
                    size="small"
                    label="Time-box user sessions"
                    descriptionText="The amount of time before a user is forced to sign in again. Use 0 for never"
                    actions={
                      <span className="mr-3 text-foreground-lighter">
                        <HoursOrNeverText value={values.SESSIONS_TIMEBOX} />
                      </span>
                    }
                    disabled={!canUpdateConfig || !isProPlanAndUp}
                  />
                  <InputNumber
                    id="SESSIONS_INACTIVITY_TIMEOUT"
                    size="small"
                    label="Inactivity timeout"
                    descriptionText="The amount of time a user needs to be inactive to be forced to sign in again. Use 0 for never."
                    actions={
                      <span className="mr-3 text-foreground-lighter">
                        <HoursOrNeverText value={values.SESSIONS_INACTIVITY_TIMEOUT} />
                      </span>
                    }
                    disabled={!canUpdateConfig || !isProPlanAndUp}
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

export default SessionsAuthSettingsForm
