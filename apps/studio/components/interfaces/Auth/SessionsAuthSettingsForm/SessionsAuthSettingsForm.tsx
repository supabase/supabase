import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
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
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  AccessTokenSchema,
  createRefreshTokenSchema,
  createUserSessionsSchema,
  MAX_REFRESH_TOKEN_REUSE_INTERVAL_SECONDS,
  MAX_SESSIONS_INACTIVITY_TIMEOUT_HOURS,
  MAX_SESSIONS_TIMEBOX_HOURS,
  type AccessTokenFormValues,
} from './SessionsAuthSettingsForm.utils'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { IS_PLATFORM } from '@/lib/constants'

function HoursOrNeverText({ value }: { value: number }) {
  if (value === 0) {
    return 'never'
  } else if (value === 1) {
    return 'hour'
  } else {
    return 'hours'
  }
}

export const SessionsAuthSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()

  // Separate loading states for each form
  const [isUpdatingAccessToken, setIsUpdatingAccessToken] = useState(false)
  const [isUpdatingRefreshTokens, setIsUpdatingRefreshTokens] = useState(false)
  const [isUpdatingUserSessions, setIsUpdatingUserSessions] = useState(false)

  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { hasAccess: hasUserSessionsEntitlement, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('auth.user_sessions')
  const promptProPlanUpgrade = IS_PLATFORM && !hasUserSessionsEntitlement

  // NOTE(fm): The maximums below were introduced after these settings were unbounded,
  // so they are validated against the currently saved value: a project already above a
  // maximum can still save the section, but can only move the value into range.
  // Normalized exactly as the reset() calls below, so an untouched field compares equal.
  const savedRefreshTokenReuseInterval = authConfig?.SECURITY_REFRESH_TOKEN_REUSE_INTERVAL ?? 0
  const savedSessionsTimebox = authConfig?.SESSIONS_TIMEBOX || 0
  const savedSessionsInactivityTimeout = authConfig?.SESSIONS_INACTIVITY_TIMEOUT || 0

  const refreshTokenResolver = useMemo(
    () =>
      zodResolver(createRefreshTokenSchema({ savedReuseInterval: savedRefreshTokenReuseInterval })),
    [savedRefreshTokenReuseInterval]
  )

  const userSessionsResolver = useMemo(
    () =>
      zodResolver(
        createUserSessionsSchema({
          savedTimebox: savedSessionsTimebox,
          savedInactivityTimeout: savedSessionsInactivityTimeout,
        })
      ),
    [savedSessionsTimebox, savedSessionsInactivityTimeout]
  )

  const accessTokenForm = useForm<AccessTokenFormValues>({
    resolver: zodResolver(AccessTokenSchema),
    defaultValues: {
      JWT_EXP: 3600,
    },
  })

  const refreshTokenForm = useForm({
    resolver: refreshTokenResolver,
    defaultValues: {
      REFRESH_TOKEN_ROTATION_ENABLED: false,
      SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 0,
    },
  })

  const userSessionsForm = useForm({
    resolver: userSessionsResolver,
    defaultValues: {
      SESSIONS_TIMEBOX: 0,
      SESSIONS_INACTIVITY_TIMEOUT: 0,
      SESSIONS_SINGLE_PER_USER: false,
    },
  })

  useEffect(() => {
    if (authConfig) {
      // Only reset forms if they're not currently being updated
      if (!isUpdatingAccessToken) {
        accessTokenForm.reset({
          JWT_EXP: authConfig.JWT_EXP ?? 3600,
        })
      }

      if (!isUpdatingRefreshTokens) {
        refreshTokenForm.reset({
          REFRESH_TOKEN_ROTATION_ENABLED: authConfig.REFRESH_TOKEN_ROTATION_ENABLED || false,
          SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: savedRefreshTokenReuseInterval,
        })
      }

      if (!isUpdatingUserSessions) {
        userSessionsForm.reset({
          SESSIONS_TIMEBOX: savedSessionsTimebox,
          SESSIONS_INACTIVITY_TIMEOUT: savedSessionsInactivityTimeout,
          SESSIONS_SINGLE_PER_USER: authConfig.SESSIONS_SINGLE_PER_USER || false,
        })
      }
    }
  }, [
    authConfig,
    isUpdatingAccessToken,
    isUpdatingRefreshTokens,
    isUpdatingUserSessions,
    savedRefreshTokenReuseInterval,
    savedSessionsTimebox,
    savedSessionsInactivityTimeout,
  ])

  const onSubmitAccessToken = (values: AccessTokenFormValues) => {
    const payload = { ...values }
    setIsUpdatingAccessToken(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: payload },
      {
        onError: (error) => {
          toast.error(`Failed to update access token settings: ${error?.message}`)
          setIsUpdatingAccessToken(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated access token settings')
          setIsUpdatingAccessToken(false)
        },
      }
    )
  }

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

  if (isLoading || isLoadingEntitlements) {
    return (
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>User Sessions</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form {...userSessionsForm}>
            <form
              onSubmit={userSessionsForm.handleSubmit(onSubmitUserSessions)}
              className="space-y-4"
            >
              <Card>
                <CardContent>
                  <FormField
                    control={userSessionsForm.control}
                    name="SESSIONS_SINGLE_PER_USER"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        name="SESSIONS_SINGLE_PER_USER"
                        label="Enforce single session per user"
                        description="If enabled, all but a user's most recently active session will be terminated."
                      >
                        <FormControl>
                          <Switch
                            id="SESSIONS_SINGLE_PER_USER"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canUpdateConfig || !hasUserSessionsEntitlement}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardContent>
                  <FormField
                    control={userSessionsForm.control}
                    name="SESSIONS_TIMEBOX"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        name="SESSIONS_TIMEBOX"
                        label="Time-box user sessions"
                        description={`The amount of time before a user is forced to sign in again. Use 0 for never. Maximum ${MAX_SESSIONS_TIMEBOX_HOURS} hours (1 year).`}
                      >
                        <FormControl className="w-full">
                          <InputGroup>
                            <FormInputGroupInput
                              id="SESSIONS_TIMEBOX"
                              type="number"
                              min={0}
                              {...field}
                              disabled={!canUpdateConfig || !hasUserSessionsEntitlement}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>
                                <HoursOrNeverText value={field.value || 0} />
                              </InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                <CardContent>
                  <FormField
                    control={userSessionsForm.control}
                    name="SESSIONS_INACTIVITY_TIMEOUT"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        name="SESSIONS_INACTIVITY_TIMEOUT"
                        label="Inactivity timeout"
                        description={`The amount of time a user needs to be inactive to be forced to sign in again. Use 0 for never. Maximum ${MAX_SESSIONS_INACTIVITY_TIMEOUT_HOURS} hours (1 year).`}
                      >
                        <FormControl className="w-full">
                          <InputGroup>
                            <FormInputGroupInput
                              id="SESSIONS_INACTIVITY_TIMEOUT"
                              type="number"
                              min={0}
                              {...field}
                              className="flex-1"
                              disabled={!canUpdateConfig || !hasUserSessionsEntitlement}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>
                                <HoursOrNeverText value={field.value || 0} />
                              </InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>

                {promptProPlanUpgrade && (
                  <UpgradeToPro
                    fullWidth
                    source="authSessions"
                    featureProposition="configure user sessions"
                    primaryText="Configuring user sessions is only available on the Pro Plan and above"
                    secondaryText="Upgrade to Pro Plan to configure settings for user sessions."
                  />
                )}

                <CardFooter className="justify-end space-x-2">
                  {userSessionsForm.formState.isDirty && (
                    <Button variant="default" onClick={() => userSessionsForm.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant={promptProPlanUpgrade ? 'default' : 'primary'}
                    type="submit"
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
          </Form>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Access Tokens</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form {...accessTokenForm}>
            <form
              onSubmit={accessTokenForm.handleSubmit(onSubmitAccessToken)}
              className="space-y-4"
            >
              <Card>
                <CardContent>
                  <FormField
                    control={accessTokenForm.control}
                    name="JWT_EXP"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        name="JWT_EXP"
                        label="Access token expiry time"
                        description="How long access tokens are valid for before they must be refreshed. Recommendation: 3600 seconds."
                      >
                        <FormControl className="w-full">
                          <InputGroup>
                            <FormInputGroupInput
                              id="JWT_EXP"
                              type="number"
                              min={1}
                              {...field}
                              disabled={!canUpdateConfig}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>seconds</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  {accessTokenForm.formState.isDirty && (
                    <Button variant="default" onClick={() => accessTokenForm.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={
                      !canUpdateConfig ||
                      isUpdatingAccessToken ||
                      !accessTokenForm.formState.isDirty
                    }
                    loading={isUpdatingAccessToken}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Refresh Tokens</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Form {...refreshTokenForm}>
            <form
              onSubmit={refreshTokenForm.handleSubmit(onSubmitRefreshTokens)}
              className="space-y-4"
            >
              <Card>
                <CardContent>
                  <FormField
                    control={refreshTokenForm.control}
                    name="REFRESH_TOKEN_ROTATION_ENABLED"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        name="REFRESH_TOKEN_ROTATION_ENABLED"
                        label="Detect and revoke potentially compromised refresh tokens"
                        description="Prevent replay attacks from potentially compromised refresh tokens."
                      >
                        <FormControl>
                          <Switch
                            id="REFRESH_TOKEN_ROTATION_ENABLED"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canUpdateConfig}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardContent>
                  <FormField
                    control={refreshTokenForm.control}
                    name="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        name="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                        label="Refresh token reuse interval"
                        description={`Time interval where the same refresh token can be used multiple times to request for an access token. Recommendation: 10 seconds. Maximum ${MAX_REFRESH_TOKEN_REUSE_INTERVAL_SECONDS} seconds (5 minutes).`}
                      >
                        <FormControl className="w-full">
                          <InputGroup>
                            <FormInputGroupInput
                              id="SECURITY_REFRESH_TOKEN_REUSE_INTERVAL"
                              type="number"
                              min={0}
                              {...field}
                              disabled={!canUpdateConfig}
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>seconds</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end space-x-2">
                  {refreshTokenForm.formState.isDirty && (
                    <Button variant="default" onClick={() => refreshTokenForm.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    type="submit"
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
          </Form>
        </PageSectionContent>
      </PageSection>
    </>
  )
}
