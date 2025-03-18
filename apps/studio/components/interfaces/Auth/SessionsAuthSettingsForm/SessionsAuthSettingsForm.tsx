import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { boolean, number, object } from 'yup'

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
  PrePostTab,
  Switch,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

function HoursOrNeverText({ value }: { value: number }) {
  if (value === 0) {
    return 'never'
  } else if (value === 1) {
    return 'hour'
  } else {
    return 'hours'
  }
}

const refreshTokenSchema = object({
  REFRESH_TOKEN_ROTATION_ENABLED: boolean().required(),
  SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: number()
    .min(0, 'Must be a value more than 0')
    .required('Must have a Reuse Interval value'),
})

const userSessionsSchema = object({
  SESSIONS_TIMEBOX: number().min(0, 'Must be a positive number'),
  SESSIONS_INACTIVITY_TIMEOUT: number().min(0, 'Must be a positive number'),
  SESSIONS_SINGLE_PER_USER: boolean(),
})

const SessionsAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  // Separate loading states for each form
  const [isUpdatingRefreshTokens, setIsUpdatingRefreshTokens] = useState(false)
  const [isUpdatingUserSessions, setIsUpdatingUserSessions] = useState(false)

  const canReadConfig = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const organization = useSelectedOrganization()
  const { data: subscription, isSuccess: isSuccessSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })

  const isProPlanAndUp = isSuccessSubscription && subscription?.plan?.id !== 'free'
  const promptProPlanUpgrade = IS_PLATFORM && !isProPlanAndUp

  const refreshTokenForm = useForm({
    resolver: yupResolver(refreshTokenSchema),
    defaultValues: {
      REFRESH_TOKEN_ROTATION_ENABLED: false,
      SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 0,
    },
  })

  const userSessionsForm = useForm({
    resolver: yupResolver(userSessionsSchema),
    defaultValues: {
      SESSIONS_TIMEBOX: 0,
      SESSIONS_INACTIVITY_TIMEOUT: 0,
      SESSIONS_SINGLE_PER_USER: false,
    },
  })

  useEffect(() => {
    if (authConfig) {
      // Only reset forms if they're not currently being updated
      if (!isUpdatingRefreshTokens) {
        refreshTokenForm.reset({
          REFRESH_TOKEN_ROTATION_ENABLED: authConfig.REFRESH_TOKEN_ROTATION_ENABLED || false,
          SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: authConfig.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL,
        })
      }

      if (!isUpdatingUserSessions) {
        userSessionsForm.reset({
          SESSIONS_TIMEBOX: authConfig.SESSIONS_TIMEBOX || 0,
          SESSIONS_INACTIVITY_TIMEOUT: authConfig.SESSIONS_INACTIVITY_TIMEOUT || 0,
          SESSIONS_SINGLE_PER_USER: authConfig.SESSIONS_SINGLE_PER_USER || false,
        })
      }
    }
  }, [authConfig, isUpdatingRefreshTokens, isUpdatingUserSessions])

  const onSubmitRefreshTokens = (values: any) => {
    const payload = { ...values }
    setIsUpdatingRefreshTokens(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update refresh token settings: ${error?.message}`)
          setIsUpdatingRefreshTokens(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated refresh token settings')
          setIsUpdatingRefreshTokens(false)
        },
      }
    )
  }

  const onSubmitUserSessions = (values: any) => {
    const payload = { ...values }
    setIsUpdatingUserSessions(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update user session settings: ${error?.message}`)
          setIsUpdatingUserSessions(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated user session settings')
          setIsUpdatingUserSessions(false)
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
    <>
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">Refresh Tokens</ScaffoldSectionTitle>

        <Form_Shadcn_ {...refreshTokenForm}>
          <form
            onSubmit={refreshTokenForm.handleSubmit(onSubmitRefreshTokens)}
            className="space-y-4"
          >
            <Card>
              <CardContent className="pt-6">
                <FormField_Shadcn_
                  control={refreshTokenForm.control}
                  name="REFRESH_TOKEN_ROTATION_ENABLED"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Detect and revoke potentially compromised refresh tokens"
                      description="Prevent replay attacks from potentially compromised refresh tokens."
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canUpdateConfig}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              {refreshTokenForm.watch('REFRESH_TOKEN_ROTATION_ENABLED') && (
                <CardContent>
                  <FormField_Shadcn_
                    control={refreshTokenForm.control}
                    name="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Refresh token reuse interval"
                        description="Time interval where the same refresh token can be used multiple times to request for an access token. Recommendation: 10 seconds."
                      >
                        <FormControl_Shadcn_>
                          <PrePostTab postTab="seconds">
                            <Input_Shadcn_
                              type="number"
                              min={0}
                              {...field}
                              disabled={!canUpdateConfig}
                            />
                          </PrePostTab>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
              )}
              <CardFooter className="justify-end space-x-2">
                {refreshTokenForm.formState.isDirty && (
                  <Button type="default" onClick={() => refreshTokenForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !canUpdateConfig ||
                    isUpdatingRefreshTokens ||
                    !refreshTokenForm.formState.isDirty
                  }
                  loading={isUpdatingRefreshTokens}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </ScaffoldSection>

      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">User Sessions</ScaffoldSectionTitle>

        <Form_Shadcn_ {...userSessionsForm}>
          <form
            onSubmit={userSessionsForm.handleSubmit(onSubmitUserSessions)}
            className="space-y-4"
          >
            <Card>
              <CardContent>
                {promptProPlanUpgrade && (
                  <div className="mb-4">
                    <UpgradeToPro
                      primaryText="Upgrade to Pro"
                      secondaryText="Configuring user sessions requires the Pro Plan."
                    />
                  </div>
                )}

                <FormField_Shadcn_
                  control={userSessionsForm.control}
                  name="SESSIONS_SINGLE_PER_USER"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Enforce single session per user"
                      description="If enabled, all but a user's most recently active session will be terminated."
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canUpdateConfig || !isProPlanAndUp}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardContent>
                <FormField_Shadcn_
                  control={userSessionsForm.control}
                  name="SESSIONS_TIMEBOX"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Time-box user sessions"
                      description="The amount of time before a user is forced to sign in again. Use 0 for never."
                    >
                      <div className="flex items-center">
                        <FormControl_Shadcn_>
                          <PrePostTab postTab={<HoursOrNeverText value={field.value || 0} />}>
                            <Input_Shadcn_
                              type="number"
                              min={0}
                              {...field}
                              disabled={!canUpdateConfig || !isProPlanAndUp}
                            />
                          </PrePostTab>
                        </FormControl_Shadcn_>
                      </div>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardContent>
                <FormField_Shadcn_
                  control={userSessionsForm.control}
                  name="SESSIONS_INACTIVITY_TIMEOUT"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Inactivity timeout"
                      description="The amount of time a user needs to be inactive to be forced to sign in again. Use 0 for never."
                    >
                      <div className="flex items-center">
                        <FormControl_Shadcn_>
                          <PrePostTab postTab={<HoursOrNeverText value={field.value || 0} />}>
                            <Input_Shadcn_
                              type="number"
                              min={0}
                              {...field}
                              disabled={!canUpdateConfig || !isProPlanAndUp}
                            />
                          </PrePostTab>
                        </FormControl_Shadcn_>
                      </div>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                {userSessionsForm.formState.isDirty && (
                  <Button type="default" onClick={() => userSessionsForm.reset()}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !canUpdateConfig ||
                    isUpdatingUserSessions ||
                    !userSessionsForm.formState.isDirty
                  }
                  loading={isUpdatingUserSessions}
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

export default SessionsAuthSettingsForm
