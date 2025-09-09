import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
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
  Switch,
  WarningIcon,
  Input,
  Badge,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { OAUTH_APP_SCOPES_OPTIONS } from './OAuthAppsList'

const schema = z.object({
  oauthServerEnabled: z.boolean().default(false),
  allowDynamicApps: z.boolean().default(false),
  allowPublicApps: z.boolean().default(false),
  availableScopes: z.array(z.string()).default(['openid', 'email', 'profile']),
})

interface OAuthServerSettings {
  oauthServerEnabled: boolean
  allowDynamicApps: boolean
  allowPublicApps: boolean
  availableScopes: string[]
}

const OAuthServerSettingsForm = () => {
  const { ref: projectRef } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [oAuthAppsCount, setOAuthAppsCount] = useState(0)

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
      oauthServerEnabled: false,
      allowDynamicApps: false,
      allowPublicApps: false,
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
      // Save to localStorage
      localStorage.setItem('oauth_server_settings', JSON.stringify(values))
      toast.success('OAuth server settings updated successfully')
    } catch (error) {
      toast.error('Failed to update OAuth server settings')
      console.error('Error saving OAuth server settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addCustomScope = () => {
    const currentScopes = form.getValues('availableScopes')
    const newScope = `custom_scope_${Date.now()}`
    form.setValue('availableScopes', [...currentScopes, newScope])
  }

  const removeScope = (scopeToRemove: string) => {
    const currentScopes = form.getValues('availableScopes')
    const updatedScopes = currentScopes.filter((scope) => scope !== scopeToRemove)
    form.setValue('availableScopes', updatedScopes)
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
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">OAuth Server</ScaffoldSectionTitle>

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Enable OAuth Server Section */}
          <Card>
            <CardContent className="py-6">
              <FormField_Shadcn_
                control={form.control}
                name="oauthServerEnabled"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Enable the Supabase OAuth Server"
                    description={
                      <>
                        Enable OAuth server functionality for your project. This allows you to
                        create and manage OAuth applications.{' '}
                        <Link
                          href="https://supabase.com/docs/guides/auth/oauth/oauth-apps"
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground-light underline hover:text-foreground transition"
                        >
                          Learn more
                        </Link>
                        {!canOAuthServerBeDisabled && (
                          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                            Cannot disable OAuth server while OAuth apps exist. Delete all OAuth
                            apps first.
                          </div>
                        )}
                      </>
                    }
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!canUpdateConfig || (!canOAuthServerBeDisabled && field.value)}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Settings Section - Only show when OAuth Server is enabled */}
          {form.watch('oauthServerEnabled') && (
            <Card>
              <CardContent className="py-6">
                <div className="space-y-6">
                  <FormField_Shadcn_
                    control={form.control}
                    name="allowDynamicApps"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Allow Dynamic OAuth Apps"
                        description="Enable dynamic OAuth app registration. Apps can be registered at runtime without manual configuration."
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

                  <FormField_Shadcn_
                    control={form.control}
                    name="allowPublicApps"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Allow Public OAuth Apps"
                        description={
                          <>
                            Enable public OAuth applications that can be accessed by any user.{' '}
                            <Link
                              href="https://supabase.com/docs/guides/auth/oauth/public-oauth-apps"
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
          )}

          {/* Available Scopes Section - Only show when OAuth Server is enabled */}
          {form.watch('oauthServerEnabled') && (
            <Card>
              <CardContent className="py-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Available Scopes</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure the OAuth scopes that can be requested by OAuth applications.
                      </p>
                    </div>
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Plus size={14} />}
                      onClick={addCustomScope}
                      disabled={!canUpdateConfig}
                    >
                      Add Scope
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scope Name</TableHead>
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
                            {OAUTH_APP_SCOPES_OPTIONS.find((opt) => opt.value === scope)?.name ||
                              'Custom scope'}
                          </TableCell>
                          <TableCell>
                            {!['openid', 'email', 'profile'].includes(scope) && (
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
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}

export default OAuthServerSettingsForm
