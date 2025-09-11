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
  ScaffoldSectionDescription,
  ScaffoldSectionTitle,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
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

const configUrlSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  description: z.string().optional(),
})

const schema = z.object({
  GOTRUE_OAUTH_SERVER_ENABLED: z.boolean().default(false),
  GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: z.boolean().default(false),
  allowPublicApps: z.boolean().default(false),
  siteUrl: z.string().url('Please provide a valid URL').optional().or(z.literal('')),
  authorizationPath: z.string().optional().or(z.literal('')),
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
  GOTRUE_OAUTH_SERVER_ENABLED: boolean
  GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: boolean
  allowPublicApps: boolean
  siteUrl?: string
  authorizationPath?: string
  availableScopes: string[]
  config_urls?: ConfigUrl[]
}

const OAuthServerSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [oAuthAppsCount, setOAuthAppsCount] = useState(0)
  const [showDynamicAppsConfirmation, setShowDynamicAppsConfirmation] = useState(false)

  const canOAuthServerBeDisabled = oAuthAppsCount === 0

  const { can: canReadConfig, isSuccess: isPermissionsLoaded } = useAsyncCheckProjectPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const form = useForm<OAuthServerSettings>({
    resolver: zodResolver(schema),
    defaultValues: {
      GOTRUE_OAUTH_SERVER_ENABLED: false,
      GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION: false,
      allowPublicApps: false,
      siteUrl: undefined,
      authorizationPath: undefined,
      availableScopes: ['openid', 'email', 'profile'],
    },
  })

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem('oauth_server_settings')
        if (stored) {
          const parsedSettings = JSON.parse(stored)
          form.reset(parsedSettings)
        }
      } catch (error) {
        console.error('Error loading OAuth server settings from localStorage:', error)
      }
      setIsLoading(false)
    }

    loadSettings()
  }, [])

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
    setIsSaving(true)
    try {
      // Generate config URLs if OAuth server is being enabled and config_urls don't exist
      const updatedValues = { ...values }
      if (values.GOTRUE_OAUTH_SERVER_ENABLED && !values.config_urls) {
        updatedValues.config_urls = generateConfigUrls()
      }

      // Save to localStorage
      localStorage.setItem('oauth_server_settings', JSON.stringify(updatedValues))
      // Reset form to clear isDirty state
      form.reset(updatedValues)
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('oauth-server-settings-changed'))
      toast.success('OAuth server settings updated successfully')
    } catch (error) {
      toast.error('Failed to update OAuth server settings')
      console.error('Error saving OAuth server settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // const addCustomScope = () => {
  //   const currentScopes = form.getValues('availableScopes')
  //   const newScope = `custom_scope_${Date.now()}`
  //   form.setValue('availableScopes', [...currentScopes, newScope])
  // }

  const removeScope = (scopeToRemove: string) => {
    const currentScopes = form.getValues('availableScopes')
    const updatedScopes = currentScopes.filter((scope) => scope !== scopeToRemove)
    form.setValue('availableScopes', updatedScopes)
  }

  const handleDynamicAppsToggle = (checked: boolean) => {
    if (checked) {
      setShowDynamicAppsConfirmation(true)
    } else {
      form.setValue('GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION', false)
    }
  }

  const confirmDynamicApps = () => {
    form.setValue('GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION', true)
    setShowDynamicAppsConfirmation(false)
  }

  const cancelDynamicApps = () => {
    setShowDynamicAppsConfirmation(false)
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-10">
              {/* Enable OAuth Server Section */}
              <Card>
                <CardContent className="flex flex-col py-6 gap-y-4">
                  <FormField_Shadcn_
                    control={form.control}
                    name="GOTRUE_OAUTH_SERVER_ENABLED"
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
                            onCheckedChange={field.onChange}
                            disabled={
                              !canUpdateConfig || (!canOAuthServerBeDisabled && field.value)
                            }
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </CardContent>
                {/* Site URL and Authorization Path - Only show when OAuth Server is enabled */}
                {form.watch('GOTRUE_OAUTH_SERVER_ENABLED') && (
                  <CardContent className="flex flex-col py-6 gap-y-4">
                    <FormField_Shadcn_
                      control={form.control}
                      name="siteUrl"
                      render={({ field }) => (
                        <FormItemLayout
                          label="Site URL"
                          description="The base URL of your application"
                        >
                          <FormControl_Shadcn_>
                            <Input {...field} placeholder="https://example.com" layout="vertical" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    <FormField_Shadcn_
                      control={form.control}
                      name="authorizationPath"
                      render={({ field }) => (
                        <FormItemLayout
                          label="Authorization Path"
                          description="Path where you'll implement the OAuth authorization UI (consent screens)"
                        >
                          <FormControl_Shadcn_>
                            <Input {...field} placeholder="/auth/authorize" layout="vertical" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                    <Admonition
                      type="tip"
                      title="Make sure this path is implemented in your application before enabling OAuth."
                      description={`Preview Authorization URL: ${form.watch('siteUrl') || 'https://myapp.com'}${form.watch('authorizationPath') || '/oauth/consent'}`}
                    />
                  </CardContent>
                )}

                {canOAuthServerBeDisabled ? (
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
                ) : (
                  <CardFooter className="p-0">
                    <Admonition
                      className="border-none m-0 rounded-none"
                      type="warning"
                      title="Cannot disable OAuth server while OAuth apps exist. Delete all OAuth apps first."
                      description={
                        <Link href={`/project/${projectRef}/auth/oauth-apps`}>View apps</Link>
                      }
                    />
                  </CardFooter>
                )}
              </Card>

              {/* Additional Settings Section - Only show when OAuth Server is enabled */}
              {form.watch('GOTRUE_OAUTH_SERVER_ENABLED') && (
                <ScaffoldSection isFullWidth>
                  <ScaffoldSectionContent>
                    <Separator />
                    <Card>
                      <CardContent className="py-6">
                        <div className="space-y-6">
                          <FormField_Shadcn_
                            control={form.control}
                            name="GOTRUE_OAUTH_SERVER_ALLOW_DYNAMIC_REGISTRATION"
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

                          <FormField_Shadcn_
                            control={form.control}
                            name="allowPublicApps"
                            render={({ field }) => (
                              <FormItemLayout
                                layout="flex-row-reverse"
                                label="Allow Public OAuth Apps"
                                description={
                                  <>
                                    Enable public OAuth applications that can be accessed by any
                                    user.{' '}
                                    <Link
                                      href="https://supabase.com/docs/guides/auth/oauth/oauth-apps#public-oauth-apps"
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
                                    onCheckedChange={field.onChange}
                                    disabled={!canUpdateConfig}
                                  />
                                </FormControl_Shadcn_>
                              </FormItemLayout>
                            )}
                          />
                        </div>
                      </CardContent>
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
    </>
  )
}

export default OAuthServerSettingsForm
