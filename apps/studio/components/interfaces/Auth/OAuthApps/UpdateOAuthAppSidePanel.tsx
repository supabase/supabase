import { zodResolver } from '@hookform/resolvers/zod'
import type { OAuthClient } from '@supabase/supabase-js'
import { Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import Panel from 'components/ui/Panel'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  SidePanel,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import OAuthAppCredentialsModal from './OAuthAppCredentialsModal'
import { OAUTH_APP_SCOPES_OPTIONS } from './OAuthAppsList'

interface UpdateOAuthAppSidePanelProps {
  visible: boolean
  onClose: () => void
  selectedApp?: OAuthClient
  onDeleteClick: (app: OAuthClient) => void
}

const FormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please provide a name for your OAuth app')
    .max(100, 'Name must be less than 100 characters')
    .default(''),
  type: z.enum(['manual', 'dynamic']).default('manual'),
  scope: z.string().min(1, 'Please select a scope').default('openid'),
  redirect_uris: z
    .object({
      value: z.string().refine((val) => val === '' || z.string().url().safeParse(val).success, {
        message: 'Please provide a valid URL',
      }),
    })
    .array()
    .default([{ value: '' }]),
  is_public: z.boolean().default(false),
})

export const UpdateOAuthAppSidePanel = ({
  visible,
  onClose,
  selectedApp,
  onDeleteClick,
}: UpdateOAuthAppSidePanelProps) => {
  const initialValues = {
    name: selectedApp?.client_name || '',
    type: selectedApp?.registration_type || 'manual',
    scope: selectedApp?.scope || 'openid',
    redirect_uris: selectedApp?.redirect_uris?.length
      ? selectedApp.redirect_uris.map((uri: string) => ({ value: uri }))
      : [{ value: '' }],
    is_public: selectedApp?.client_type === 'public' || false,
  }
  const submitRef = useRef<HTMLButtonElement>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    clientId: string
    clientSecret: string
  } | null>(null)

  useEffect(() => {
    if (selectedApp) {
      const values = {
        name: selectedApp.client_name,
        type: selectedApp.registration_type,
        scopes: selectedApp.scope,
        redirect_uris: selectedApp.redirect_uris?.length
          ? selectedApp.redirect_uris.map((uri: string) => ({ value: uri }))
          : [{ value: '' }],
        is_public: selectedApp.client_type === 'public',
      }
      form.reset(values)
    }
  }, [visible, selectedApp])

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  const {
    fields: redirectUriFields,
    append: appendRedirectUri,
    remove: removeRedirectUri,
  } = useFieldArray({
    name: 'redirect_uris',
    control: form.control,
  })

  const generateClientSecret = () => {
    // Generate a secure random client secret (32 characters)
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  const handleRegenerateSecret = () => {
    if (!selectedApp) return

    const newClientSecret = generateClientSecret()

    // Update the app with new secret
    const updatedApp: OAuthClient = {
      ...selectedApp,
      client_secret: newClientSecret,
    }

    // Update in localStorage
    const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
    const updatedApps = existingApps.map((app: OAuthClient) =>
      app.client_id === selectedApp.client_id ? updatedApp : app
    )
    localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

    toast.success('Client secret regenerated successfully')
    closePanel()

    // Show credentials modal after a brief delay
    setTimeout(() => {
      setGeneratedCredentials({ clientId: selectedApp.client_id, clientSecret: newClientSecret })
      setShowCredentialsModal(true)
    }, 100)
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!selectedApp) return

    setIsUpdating(true)

    try {
      // Update the OAuth app object
      const updatedApp: OAuthClient = {
        ...selectedApp,
        client_name: data.name,
        registration_type: data.type,
        scope: data.scope,
        redirect_uris: data.redirect_uris
          .filter((uri) => uri.value.trim())
          .map((uri) => uri.value.trim()),
      }

      // Update in localStorage
      const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
      const updatedApps = existingApps.map((app: OAuthClient) =>
        app.client_id === selectedApp.client_id ? updatedApp : app
      )
      localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

      toast.success(`Successfully updated OAuth app "${data.name}"`)
      closePanel()
    } catch (error) {
      toast.error('Failed to update OAuth app')
      console.error('Error updating OAuth app:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const closePanel = () => {
    form.reset(initialValues)
    setShowCredentialsModal(false)
    setGeneratedCredentials(null)
    onClose()
  }

  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false)
    setGeneratedCredentials(null)
  }

  return (
    <Fragment>
      <SidePanel
        size="large"
        loading={isUpdating}
        visible={visible}
        onCancel={closePanel}
        onDelete={() => onDeleteClick(selectedApp!)}
        header="Update OAuth App"
        confirmText="Update OAuth App"
        deleteText="Delete OAuth App"
        onConfirm={() => {
          if (submitRef.current) submitRef.current.click()
        }}
      >
        <SidePanel.Content className="py-4">
          <Form_Shadcn_ {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout label="Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="My OAuth App" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {/* <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead key="users">Users</TableHead>
                      <TableHead key="last_used">Last used</TableHead>
                      <TableHead key="registration_type">Registration type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>{selectedApp?.users_count || 0}</TableCell>
                      <TableCell>
                        {selectedApp?.last_used_at
                          ? dayjs(selectedApp?.last_used_at).format('D MMM, YYYY')
                          : 'Never'}
                      </TableCell>
                      <TableCell className="w-48">
                        <Badge>{selectedApp?.type}</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card> */}

              <Separator />

              {selectedApp && (
                <Panel>
                  <Panel.Content className="space-y-4">
                    <Input
                      label="Client ID"
                      readOnly
                      copy
                      className="input-mono"
                      value={selectedApp.client_id}
                      layout="vertical"
                    />

                    <Input
                      label="Client Secret"
                      readOnly
                      type="password"
                      className="input-mono"
                      value="****************************************************************"
                      descriptionText="Client secret is hidden for security. Use the regenerate button to create a new one."
                      layout="vertical"
                    />

                    <Button type="default" onClick={handleRegenerateSecret} className="w-full">
                      Regenerate Client Secret
                    </Button>
                  </Panel.Content>
                </Panel>
              )}

              <FormField_Shadcn_
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItemLayout
                    label="Scopes"
                    layout="vertical"
                    description={
                      <>
                        Select the permissions your app will request from users.{' '}
                        <Link
                          href="https://supabase.com/docs/guides/auth/oauth/oauth-apps#scopes"
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
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_ className="w-full">
                          <SelectValue_Shadcn_ placeholder="Select scope..." />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {OAUTH_APP_SCOPES_OPTIONS.map((scope) => (
                            <SelectItem_Shadcn_ key={scope.value} value={scope.value}>
                              {scope.name}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="redirect_uris"
                render={() => (
                  <FormItemLayout
                    label="Redirect URIs"
                    layout="vertical"
                    description="URLs where users will be redirected after authentication."
                  >
                    <div className="space-y-2">
                      {redirectUriFields.map((field, index) => (
                        <FormField_Shadcn_
                          control={form.control}
                          key={field.id}
                          name={`redirect_uris.${index}.value`}
                          render={({ field: inputField }) => (
                            <FormItem_Shadcn_>
                              <FormControl_Shadcn_>
                                <div className="flex items-center space-x-2">
                                  <Input_Shadcn_
                                    {...inputField}
                                    placeholder="https://example.com/callback (optional)"
                                    className="flex-1"
                                  />
                                  {redirectUriFields.length > 1 && (
                                    <Button
                                      type="default"
                                      size="tiny"
                                      icon={<Trash2 size={14} />}
                                      onClick={() => removeRedirectUri(index)}
                                    />
                                  )}
                                </div>
                              </FormControl_Shadcn_>
                              <FormMessage_Shadcn_ />
                            </FormItem_Shadcn_>
                          )}
                        />
                      ))}
                    </div>
                    <Button
                      type="default"
                      icon={<Plus strokeWidth={1.5} />}
                      onClick={() => appendRedirectUri({ value: '' })}
                      className="mt-2"
                    >
                      Add redirect URI
                    </Button>
                  </FormItemLayout>
                )}
              />

              <Separator />

              <FormField_Shadcn_
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItemLayout
                    label="Public"
                    layout="flex"
                    description={
                      <>
                        If enabled, the Authorization Code with PKCE (Proof Key for Code Exchange)
                        flow can be used, particularly beneficial for applications that cannot
                        securely store Client Secrets, such as native and mobile apps.{' '}
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
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <Button ref={submitRef} htmlType="submit" type="default" className="hidden">
                Update
              </Button>
            </form>
          </Form_Shadcn_>
        </SidePanel.Content>
      </SidePanel>

      {generatedCredentials && (
        <OAuthAppCredentialsModal
          visible={showCredentialsModal}
          onClose={handleCredentialsModalClose}
          clientId={generatedCredentials.clientId}
          clientSecret={generatedCredentials.clientSecret}
        />
      )}
    </Fragment>
  )
}
