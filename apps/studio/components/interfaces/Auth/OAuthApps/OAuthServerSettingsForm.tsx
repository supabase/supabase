import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Switch,
  Input,
  Badge,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { OAUTH_APP_SCOPES_OPTIONS } from './OAuthAppsList'
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'

const configUrlSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
})

const schema = z.object({
  OAUTH_SERVER_ENABLED: z.boolean().nullish().default(false),
  OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: z.boolean().nullish().default(false),
  OAUTH_SERVER_AUTHORIZATION_PATH: z.string().nullish().optional().or(z.literal('')),
  availableScopes: z.array(z.string()).default(['openid', 'email', 'profile']),
  config_urls: z.array(configUrlSchema).optional(),
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

const OAuthServerSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading } = useAuthConfigUpdateMutation()
  const [isSaving, setIsSaving] = useState(false)
  const [oAuthAppsCount, setOAuthAppsCount] = useState(0)
  const [showDynamicAppsConfirmation, setShowDynamicAppsConfirmation] = useState(false)
  const [showDisableOAuthServerConfirmation, setShowDisableOAuthServerConfirmation] =
    useState(false)

  const { can: canReadConfig, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const form = useForm<OAuthServerSettings>({
    resolver: zodResolver(schema),
    defaultValues: {
      OAUTH_SERVER_ENABLED: false,
      OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: false,
      OAUTH_SERVER_AUTHORIZATION_PATH: undefined,
      availableScopes: ['openid', 'email', 'profile'],
    },
  })

  // Load settings from auth config
  useEffect(() => {
    if (authConfig) {
      form.reset({
        OAUTH_SERVER_ENABLED: authConfig.OAUTH_SERVER_ENABLED ?? false,
        OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION:
          authConfig.OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION ?? false,
        OAUTH_SERVER_AUTHORIZATION_PATH: authConfig.OAUTH_SERVER_AUTHORIZATION_PATH ?? '',
        availableScopes: ['openid', 'email', 'profile'], // Keep default scopes
      })
    }
  }, [authConfig])

  // Load OAuth apps count from localStorage
  useEffect(() => {
    const loadOAuthAppsCount = () => {
      try {
        const stored = localStorage.getItem('oauth_apps')
        if (stored) {
          const parsedApps = JSON.parse(stored)
          setOAuthAppsCount(parsedApps.length)
        }
      } catch (error) {
        console.error('Error loading OAuth apps count from localStorage:', error)
      }
    }

    loadOAuthAppsCount()

    // Listen for changes to OAuth apps in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oauth_apps') {
        loadOAuthAppsCount()
      }
    }

    // Listen for custom events when OAuth apps are modified in the same tab
    const handleOAuthAppsChange = () => {
      loadOAuthAppsCount()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('oauth-apps-changed', handleOAuthAppsChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('oauth-apps-changed', handleOAuthAppsChange)
    }
  }, [])

  const onSubmit = async (values: OAuthServerSettings) => {
    if (!projectRef) return console.error('Project ref is required')

    setIsSaving(true)

    const config = {
      OAUTH_SERVER_ENABLED: values.OAUTH_SERVER_ENABLED,
      OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: values.OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION,
      OAUTH_SERVER_AUTHORIZATION_PATH: values.OAUTH_SERVER_AUTHORIZATION_PATH || null,
    }

    updateAuthConfig(
      { projectRef, config },
      {
        onError: (error) => {
          toast.error(`Failed to update OAuth server settings: ${error?.message}`)
          setIsSaving(false)
        },
        onSuccess: () => {
          toast.success('OAuth server settings updated successfully')
          setIsSaving(false)
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('oauth-server-settings-changed'))
        },
      }
    )
  }

  const removeScope = (scopeToRemove: string) => {
    const currentScopes = form.getValues('availableScopes')
    const updatedScopes = currentScopes.filter((scope) => scope !== scopeToRemove)
    form.setValue('availableScopes', updatedScopes, { shouldDirty: true })
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
    if (!checked && oAuthAppsCount > 0) {
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

  const generateConfigUrls = (): ConfigUrl[] => {
    return [
      {
        id: 'authorize_url',
        name: 'Authorize URL',
        value: `https://${projectRef}.supabase.co/auth/v1/authorize`,
        description: 'OAuth authorization endpoint',
      },
      {
        id: 'token_url',
        name: 'Token URL',
        value: `https://${projectRef}.supabase.co/auth/v1/token`,
        description: 'OAuth token endpoint',
      },
    ]
  }

  if (isLoading) {
    return (
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">OAuth Server</ScaffoldSectionTitle>
        <Card>
          <CardContent className="py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </ScaffoldSection>
    )
  }

  if (isPermissionsLoaded && !canReadConfig) {
    return (
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionTitle className="mb-4">OAuth Server</ScaffoldSectionTitle>
        <div className="mt-8">
          <NoPermission resourceText="view OAuth server settings" />
        </div>
      </ScaffoldSection>
    )
  }

  return (
    <>
      <ScaffoldSection isFullWidth>
        <ScaffoldSectionContent>
          <Form_Shadcn_ {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="pb-10">
              {/* Enable OAuth Server Section */}
              <Card>
                <CardContent className="flex flex-col py-6 gap-y-4">
                  <FormField_Shadcn_
                    control={form.control}
                    name="OAUTH_SERVER_ENABLED"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Enable the Supabase OAuth Server"
                        description={
                          <>
                            Enable OAuth server functionality for your project to create and manage
                            OAuth applications.{' '}
                            <Link
                              href="https://supabase.com/docs/guides/auth/oauth/oauth-apps"
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground-light underline hover:text-foreground transition"
                            >
                              Learn more
                            </Link>
                          </>
                        }
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
                {/* Site URL and Authorization Path - Only show when OAuth Server is enabled */}
                {form.watch('OAUTH_SERVER_ENABLED') && (
                  <>
                    <CardContent className="flex flex-col py-6 gap-y-4">
                      <FormItemLayout
                        label="Site URL"
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
                        <Input
                          value={authConfig?.SITE_URL || ''}
                          disabled
                          placeholder="https://example.com"
                          layout="vertical"
                        />
                      </FormItemLayout>

                      <FormField_Shadcn_
                        control={form.control}
                        name="OAUTH_SERVER_AUTHORIZATION_PATH"
                        render={({ field }) => (
                          <FormItemLayout
                            label="Authorization Path"
                            description="Path where you'll implement the OAuth authorization UI (consent screens)."
                          >
                            <FormControl_Shadcn_>
                              <Input {...field} placeholder="/auth/authorize" layout="vertical" />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                      <Admonition
                        type="tip"
                        title="Make sure this path is implemented in your application."
                        description={`Preview Authorization URL: ${authConfig?.SITE_URL || 'https://myapp.com'}${form.watch('OAUTH_SERVER_AUTHORIZATION_PATH') || '/oauth/consent'}`}
                      />
                    </CardContent>
                    <CardContent className="py-6">
                      <div className="space-y-6">
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
                                  programmatically via apis.{' '}
                                  <Link
                                    href="https://supabase.com/docs/guides/auth/oauth/oauth-apps#dynamic-oauth-apps"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-foreground-light underline hover:text-foreground transition"
                                  >
                                    Learn more
                                  </Link>
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
                      </div>
                    </CardContent>
                  </>
                )}

                <CardFooter className="justify-end space-x-2">
                  {form.formState.isDirty && (
                    <Button type="default" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    disabled={!canUpdateConfig || isSaving || !form.formState.isDirty}
                    loading={isSaving}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>

              {/* Additional Settings Section - Only show when OAuth Server is enabled */}
              {form.watch('OAUTH_SERVER_ENABLED') && (
                <ScaffoldSection isFullWidth>
                  <ScaffoldSectionContent>
                    <Separator />

                    <Card>
                      <CardHeader>
                        <CardTitle>Scopes</CardTitle>
                        <CardDescription>
                          OAuth scopes that can be requested by OAuth applications.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="px-6">Value</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {form.watch('availableScopes').map((scope) => (
                              <TableRow key={scope}>
                                <TableCell>
                                  <Badge variant="secondary" className="font-mono">
                                    {scope}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {OAUTH_APP_SCOPES_OPTIONS.find((opt) => opt.value === scope)
                                    ?.name || 'Custom scope'}
                                </TableCell>
                                <TableCell>
                                  {!['profile', 'email', 'openid'].includes(scope) && (
                                    <Button
                                      type="default"
                                      size="tiny"
                                      icon={<Trash2 size={14} />}
                                      onClick={() => removeScope(scope)}
                                      disabled={!canUpdateConfig}
                                    />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {form.watch('config_urls') && (form.watch('config_urls')?.length ?? 0) > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Configuration URLs</CardTitle>
                          <CardDescription>
                            OAuth endpoints for your authorization server. Click to copy.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col gap-4">
                            {form
                              .watch('config_urls')
                              ?.map((configUrl) => (
                                <Input
                                  key={configUrl.id}
                                  id={configUrl.id}
                                  label={configUrl.name}
                                  descriptionText={configUrl.description}
                                  layout="vertical"
                                  copy
                                  value={configUrl.value}
                                  readOnly
                                  className="font-mono text-sm"
                                />
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </ScaffoldSectionContent>
                </ScaffoldSection>
              )}
            </form>
          </Form_Shadcn_>
        </ScaffoldSectionContent>
      </ScaffoldSection>

      {/* Dynamic Apps Confirmation Modal */}
      <ConfirmationModal
        variant="warning"
        visible={showDynamicAppsConfirmation}
        size="large"
        title="Enable dynamic client registration"
        confirmLabel="Enable dynamic registration"
        onConfirm={confirmDynamicApps}
        onCancel={cancelDynamicApps}
        alert={{
          title:
            'By confirming, you acknowledge the risks and would like to move forward with enabling dynamic client registration.',
        }}
      >
        <p className="text-sm text-foreground-lighter pb-4">
          Enabling dynamic client registration will open up a public API endpoint that anyone can
          use to register OAuth applications with your app. This can be a security concern, as
          attackers could register OAuth applications with legitimate-sounding names and send them
          to your users for approval.
        </p>
        <p className="text-sm text-foreground-lighter pb-4">
          If your users don't look carefully and accept, the attacker could potentially take over
          the user's account. Attackers can also flood your application with thousands of OAuth
          applications that cannot be attributed to anyone (as it's a public endpoint), and make it
          difficult for you to find and shut them down, or even find legitimate ones.
        </p>
        <p className="text-sm text-foreground-lighter pb-4">
          If dynamic client registration is enabled, the consent screen is forced to be enabled for
          all OAuth flows and can no longer be disabled. Disabling the consent screen opens up a
          CSRF vulnerability in your app.
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
          title: `You have ${oAuthAppsCount} active OAuth app${oAuthAppsCount > 1 ? 's' : ''} that will be deactivated.`,
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

export default OAuthServerSettingsForm
