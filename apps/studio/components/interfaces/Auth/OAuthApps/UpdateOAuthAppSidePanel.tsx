import { useEffect, useRef, useState, Fragment } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import * as z from 'zod'

import {
  Button,
  Card,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input,
  Input_Shadcn_,
  SidePanel,
  Switch,
  Separator,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Badge,
} from 'ui'
import { MultiSelector } from 'ui-patterns/multi-select'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { OAUTH_APP_SCOPES_OPTIONS } from './OAuthAppsList'
import OAuthAppCredentialsModal from './OAuthAppCredentialsModal'
import Panel from 'components/ui/Panel'

import type { OAuthApp } from 'pages/project/[ref]/auth/oauth-apps'

interface UpdateOAuthAppSidePanelProps {
  visible: boolean
  onClose: () => void
  onSuccess: (app: OAuthApp) => void
  selectedApp?: OAuthApp
  onDeleteClick: (app: OAuthApp) => void
}

const UpdateOAuthAppSidePanel = ({
  visible,
  onClose,
  onSuccess,
  selectedApp,
  onDeleteClick,
}: UpdateOAuthAppSidePanelProps) => {
  const initialValues = {
    name: selectedApp?.name || '',
    type: (selectedApp?.type as 'manual' | 'dynamic') || 'manual',
    scopes: selectedApp?.scopes || ['openid'],
    redirect_uris: selectedApp?.redirect_uris?.length
      ? selectedApp.redirect_uris.map((uri: string) => ({ value: uri }))
      : [{ value: '' }],
    is_public: selectedApp?.is_public || false,
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
        name: selectedApp.name,
        type: selectedApp.type,
        scopes: selectedApp.scopes,
        redirect_uris: selectedApp.redirect_uris?.length
          ? selectedApp.redirect_uris.map((uri: string) => ({ value: uri }))
          : [{ value: '' }],
        is_public: selectedApp.is_public,
      }
      form.reset(values)
    }
  }, [visible, selectedApp])

  const FormSchema = z.object({
    name: z
      .string()
      .min(1, 'Please provide a name for your OAuth app')
      .max(100, 'Name must be less than 100 characters')
      .default(''),
    type: z.enum(['manual', 'dynamic']).default('manual'),
    scopes: z.array(z.string()).min(1, 'Please select at least one scope').default(['openid']),
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

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  const {
    fields: redirectUriFields,
    append: appendRedirectUri,
    remove: removeRedirectUri,
    move: moveRedirectUri,
  } = useFieldArray({
    name: 'redirect_uris',
    control: form.control,
  })

  const updateOrder = (result: any) => {
    // Dropped outside of the list
    if (!result.destination) return
    moveRedirectUri(result.source.index, result.destination.index)
  }

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
    const updatedApp: OAuthApp = {
      ...selectedApp,
      client_secret: newClientSecret,
    }

    // Update in localStorage
    const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
    const updatedApps = existingApps.map((app: OAuthApp) =>
      app.id === selectedApp.id ? updatedApp : app
    )
    localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

    toast.success('Client secret regenerated successfully')
    onSuccess(updatedApp)

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
      const updatedApp: OAuthApp = {
        ...selectedApp,
        name: data.name,
        type: data.type,
        scopes: data.scopes,
        redirect_uris: data.redirect_uris
          .filter((uri) => uri.value.trim())
          .map((uri) => uri.value.trim()),
      }

      // Update in localStorage
      const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
      const updatedApps = existingApps.map((app: OAuthApp) =>
        app.id === selectedApp.id ? updatedApp : app
      )
      localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

      toast.success(`Successfully updated OAuth app "${data.name}"`)
      onSuccess(updatedApp)
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
        onDelete={() => onDeleteClick(selectedApp as OAuthApp)}
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

              <Card>
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
              </Card>

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
                name="scopes"
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
                      <MultiSelector values={field.value} onValuesChange={field.onChange}>
                        <MultiSelector.Trigger>
                          <MultiSelector.Input placeholder="Select scopes..." />
                        </MultiSelector.Trigger>
                        <MultiSelector.Content>
                          <MultiSelector.List>
                            {OAUTH_APP_SCOPES_OPTIONS.map((scope) => (
                              <MultiSelector.Item key={scope.value} value={scope.value}>
                                {scope.name}
                              </MultiSelector.Item>
                            ))}
                          </MultiSelector.List>
                        </MultiSelector.Content>
                      </MultiSelector>
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
                    <DragDropContext onDragEnd={(result: any) => updateOrder(result)}>
                      <Droppable droppableId="redirect_uris_droppable">
                        {(droppableProvided: DroppableProvided) => (
                          <div ref={droppableProvided.innerRef} className="space-y-2">
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
                            {droppableProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
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

export default UpdateOAuthAppSidePanel
