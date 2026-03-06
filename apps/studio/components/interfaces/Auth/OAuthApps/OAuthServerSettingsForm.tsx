import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useOAuthServerAppsQuery } from 'data/oauth-server-apps/oauth-server-apps-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  cn,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { PageSection, PageSectionContent } from 'ui-patterns'

const OAuthEndpointsTable = dynamic(() =>
  import('./OAuthEndpointsTable').then((mod) => ({ default: mod.OAuthEndpointsTable }))
)

const configUrlSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
})

const schema = z
  .object({
    OAUTH_SERVER_ENABLED: z.boolean().default(false),
    OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: z.boolean().default(false),
    OAUTH_SERVER_AUTHORIZATION_PATH: z.string().default(''),
    availableScopes: z.array(z.string()).default(['openid', 'email', 'profile']),
    config_urls: z.array(configUrlSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.OAUTH_SERVER_ENABLED && data.OAUTH_SERVER_AUTHORIZATION_PATH.trim() === '') {
      ctx.addIssue({
        path: ['OAUTH_SERVER_AUTHORIZATION_PATH'],
        code: z.ZodIssueCode.custom,
        message: 'Authorization Path is required when OAuth Server is enabled.',
      })
    }
  })

interface ConfigUrl {
  id: string
  name: string
  value: string
  description?: string
}

interface OAuthServerSettings {
  OAUTH_SERVER_ENABLED: boolean
  OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: boolean
  OAUTH_SERVER_AUTHORIZATION_PATH?: string
  availableScopes: string[]
  config_urls?: ConfigUrl[]
}

export const OAuthServerSettingsForm = () => {
  const { ref: projectRef } = useParams()

  const {
    data: authConfig,
    isPending: isAuthConfigLoading,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthConfig, isPending } = useAuthConfigUpdateMutation({
    onSuccess: (_, variables) => {
      toast.success('OAuth server settings updated successfully')
      form.reset({
        OAUTH_SERVER_ENABLED: variables.config.OAUTH_SERVER_ENABLED ?? false,
        OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION:
          variables.config.OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION ?? false,
        OAUTH_SERVER_AUTHORIZATION_PATH:
          variables.config.OAUTH_SERVER_AUTHORIZATION_PATH ?? '/oauth/consent',
        availableScopes: ['openid', 'email', 'profile'],
      })
    },
    onError: (error) => {
      toast.error(`Failed to update OAuth server settings: ${error?.message}`)
    },
  })

  const [showDynamicAppsConfirmation, setShowDynamicAppsConfirmation] = useState(false)
  const [showDisableOAuthServerConfirmation, setShowDisableOAuthServerConfirmation] =
    useState(false)

  const {
    can: canReadConfig,
    isLoading: isLoadingPermissions,
    isSuccess: isPermissionsLoaded,
  } = useAsyncCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  const { data: oAuthAppsData } = useOAuthServerAppsQuery({ projectRef })

  const oauthApps = oAuthAppsData?.clients || []

  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const form = useForm<OAuthServerSettings>({
    resolver: zodResolver(schema),
    defaultValues: {
      OAUTH_SERVER_ENABLED: true,
      OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: false,
      OAUTH_SERVER_AUTHORIZATION_PATH: '/oauth/consent',
      availableScopes: ['openid', 'email', 'profile'],
    },
  })

  // Reset the values when the authConfig is loaded
  useEffect(() => {
    if (isSuccess && authConfig) {
      form.reset({
        OAUTH_SERVER_ENABLED: authConfig.OAUTH_SERVER_ENABLED ?? false,
        OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION:
          authConfig.OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION ?? false,
        OAUTH_SERVER_AUTHORIZATION_PATH:
          authConfig.OAUTH_SERVER_AUTHORIZATION_PATH ?? '/oauth/consent',
        availableScopes: ['openid', 'email', 'profile'], // Keep default scopes
      })
    }
  }, [isSuccess])

  const onSubmit = async (values: OAuthServerSettings) => {
    if (!projectRef) return console.error('Project ref is required')

    const config = {
      OAUTH_SERVER_ENABLED: values.OAUTH_SERVER_ENABLED,
      OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: values.OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION,
      OAUTH_SERVER_AUTHORIZATION_PATH: values.OAUTH_SERVER_AUTHORIZATION_PATH,
    }

    updateAuthConfig({ projectRef, config })
  }

  const handleDynamicAppsToggle = (checked: boolean) => {
    if (checked) {
      setShowDynamicAppsConfirmation(true)
    } else {
      form.setValue('OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION', false, { shouldDirty: true })
    }
  }

  const confirmDynamicApps = () => {
    form.setValue('OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION', true, { shouldDirty: true })
    setShowDynamicAppsConfirmation(false)
  }

  const cancelDynamicApps = () => {
    setShowDynamicAppsConfirmation(false)
  }

  const handleOAuthServerToggle = (checked: boolean) => {
    if (!checked && oauthApps.length > 0) {
      setShowDisableOAuthServerConfirmation(true)
    } else {
      form.setValue('OAUTH_SERVER_ENABLED', checked, { shouldDirty: true })
    }
  }

  const confirmDisableOAuthServer = () => {
    form.setValue('OAUTH_SERVER_ENABLED', false, { shouldDirty: true })
    setShowDisableOAuthServerConfirmation(false)
  }

  const cancelDisableOAuthServer = () => {
    setShowDisableOAuthServerConfirmation(false)
  }

  if (isPermissionsLoaded && !canReadConfig) {
    return <NoPermission resourceText="view OAuth server settings" />
  }

  if (isAuthConfigLoading || isLoadingPermissions) {
    return (
      <PageSection>
        <PageSectionContent>
          <Card>
            <CardContent>
              <GenericSkeletonLoader />
            </CardContent>
          </Card>
          {authConfig?.OAUTH_SERVER_ENABLED && <OAuthEndpointsTable isLoading />}
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <>
      <PageSection>
        <PageSectionContent>
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="OAUTH_SERVER_ENABLED"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Enable the Supabase OAuth Server"
                        description="Enable OAuth server functionality for your project to create and manage OAuth applications."
                      >
                        <FormControl_Shadcn_>
                          <Switch
                            checked={field.value}
                            onCheckedChange={handleOAuthServerToggle}
                            disabled={!canUpdateConfig}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                {form.watch('OAUTH_SERVER_ENABLED') && (
                  <>
                    <CardContent>
                      <FormItemLayout
                        label="Site URL"
                        layout="flex-row-reverse"
                        description={
                          <>
                            The base URL of your application, configured in{' '}
                            <Link
                              href={`/project/${projectRef}/auth/url-configuration`}
                              rel="noreferrer"
                              className="text-foreground-light underline hover:text-foreground transition"
                            >
                              Auth URL Configuration
                            </Link>{' '}
                            settings.
                          </>
                        }
                      >
                        <Input_Shadcn_
                          value={authConfig?.SITE_URL}
                          disabled
                          placeholder="https://example.com"
                        />
                      </FormItemLayout>
                    </CardContent>
                    <CardContent className="space-y-4">
                      <FormField_Shadcn_
                        control={form.control}
                        name="OAUTH_SERVER_AUTHORIZATION_PATH"
                        render={({ field }) => (
                          <FormItemLayout
                            label="Authorization Path"
                            layout="flex-row-reverse"
                            description="Path where you'll implement the OAuth authorization UI (consent screens)."
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ {...field} placeholder="/auth/authorize" />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                      {(() => {
                        const authorizationUrl = `${authConfig?.SITE_URL}${form.watch('OAUTH_SERVER_AUTHORIZATION_PATH') || '/oauth/consent'}`
                        return (
                          <Admonition
                            type="tip"
                            title="Make sure this path is implemented in your application."
                            description={
                              <>
                                Preview Authorization URL:{' '}
                                <a
                                  href={authorizationUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-foreground-light underline hover:text-foreground transition"
                                >
                                  {authorizationUrl}
                                </a>
                              </>
                            }
                          />
                        )
                      })()}
                    </CardContent>
                    <CardContent>
                      <FormField_Shadcn_
                        control={form.control}
                        name="OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Allow Dynamic OAuth Apps"
                            description={
                              <>
                                Enable dynamic OAuth app registration. Apps can be registered
                                programmatically via APIs.{' '}
                                <InlineLink
                                  href={`${DOCS_URL}/guides/auth/oauth-server/mcp-authentication#oauth-client-setup`}
                                >
                                  Learn more
                                </InlineLink>
                              </>
                            }
                          >
                            <FormControl_Shadcn_>
                              <Switch
                                checked={field.value}
                                onCheckedChange={handleDynamicAppsToggle}
                                disabled={!canUpdateConfig}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                  </>
                )}

                <CardFooter className="justify-end space-x-2">
                  <Button type="default" onClick={() => form.reset()} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!canUpdateConfig || !form.formState.isDirty}
                    loading={isPending}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form_Shadcn_>
        </PageSectionContent>
      </PageSection>
      {(form.watch('OAUTH_SERVER_ENABLED') || authConfig?.OAUTH_SERVER_ENABLED) && (
        <OAuthEndpointsTable
          isPreview={!authConfig?.OAUTH_SERVER_ENABLED}
          isLoading={isPending}
          className={cn(
            !form.watch('OAUTH_SERVER_ENABLED') && authConfig?.OAUTH_SERVER_ENABLED && 'opacity-60'
          )}
        />
      )}

      {/* Dynamic Apps Confirmation Modal */}
      <ConfirmationModal
        variant="warning"
        visible={showDynamicAppsConfirmation}
        size="large"
        title="Enable dynamic OAuth app registration"
        confirmLabel="Enable dynamic app registration"
        onConfirm={confirmDynamicApps}
        onCancel={cancelDynamicApps}
        alert={{
          title:
            'By confirming, you acknowledge the risks and would like to move forward with enabling dynamic OAuth app registration.',
        }}
      >
        <p className="text-sm text-foreground-lighter pb-4">
          Dynamic OAuth apps (also known as dynamic client registration) exposes a public endpoint
          allowing anyone to register OAuth clients. Bad actors could create malicious apps with
          legitimate-sounding names to phish your users for authorization.
        </p>
        <p className="text-sm text-foreground-lighter pb-4">
          You may also see spam registrations that are difficult to trace or moderate, making it
          harder to identify trustworthy applications in your OAuth apps list.
        </p>
        <p className="text-sm text-foreground-lighter pb-4">
          Only enable this if you have a specific use case requiring programmatic client
          registration and understand the security implications.
        </p>
      </ConfirmationModal>

      {/* Disable OAuth Server Confirmation Modal */}
      <ConfirmationModal
        variant="warning"
        visible={showDisableOAuthServerConfirmation}
        size="large"
        title="Disable OAuth Server"
        confirmLabel="Disable OAuth Server"
        onConfirm={confirmDisableOAuthServer}
        onCancel={cancelDisableOAuthServer}
        alert={{
          title: `You have ${oauthApps.length} active OAuth app${oauthApps.length > 1 ? 's' : ''} that will be deactivated.`,
        }}
      >
        <p className="text-sm text-foreground-lighter pb-4">
          Disabling the OAuth Server will immediately deactivate all OAuth applications and prevent
          new authentication flows from working. This action will affect all users currently using
          your OAuth applications.
        </p>
        <p className="text-sm text-foreground-lighter pb-4">
          <strong>What will happen:</strong>
        </p>
        <ul className="text-sm text-foreground-lighter pb-4 list-disc list-inside space-y-1">
          <li>All OAuth apps will be deactivated</li>
          <li>Existing access tokens will become invalid</li>
          <li>Users won't be able to sign in through OAuth flows</li>
          <li>Third-party integrations will stop working</li>
        </ul>
        <p className="text-sm text-foreground-lighter pb-4">
          You can re-enable the OAuth Server at any time.
        </p>
      </ConfirmationModal>
    </>
  )
}
