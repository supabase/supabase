import { useEffect, useRef, useState, Fragment } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
  Modal,
  Switch,
} from 'ui'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorTrigger,
  MultiSelectorList,
  MultiSelectorItem,
} from 'ui-patterns/multi-select'
import { OAUTH_APP_SCOPES_OPTIONS } from './OAuthAppsList'
import OAuthAppCredentialsModal from './OAuthAppCredentialsModal'
import type { OAuthApp } from 'pages/project/[ref]/auth/oauth-apps'

interface CreateOAuthAppModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (app: OAuthApp) => void
}

const CreateOAuthAppModal = ({ visible, onClose, onSuccess }: CreateOAuthAppModalProps) => {
  const initialValues = {
    name: '',
    type: 'manual' as const,
    scopes: ['email', 'profile'],
    redirect_uris: [{ value: '' }],
    is_public: false,
  }
  const submitRef = useRef<HTMLButtonElement>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    clientId: string
    clientSecret: string
  } | null>(null)

  useEffect(() => {
    form.reset(initialValues)
  }, [visible])

  const FormSchema = z.object({
    name: z
      .string()
      .min(1, 'Please provide a name for your OAuth app')
      .max(100, 'Name must be less than 100 characters')
      .default(''),
    type: z.enum(['manual', 'dynamic']).default('manual'),
    scopes: z
      .array(z.string())
      .min(1, 'Please select at least one scope')
      .default(['profile', 'email']),
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

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsCreating(true)

    try {
      // Generate a unique ID and client_id
      const id = Date.now().toString()
      const client_id = `oauth_${id}`
      const client_secret = generateClientSecret()

      // Create the OAuth app object
      const newApp: OAuthApp = {
        id,
        client_id,
        client_secret,
        name: data.name,
        type: data.type,
        scopes: data.scopes,
        redirect_uris: data.redirect_uris
          .filter((uri) => uri.value.trim())
          .map((uri) => uri.value.trim()),
        is_public: data.is_public,
        created_at: new Date().toISOString(),
      }

      // Save to localStorage
      const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
      const updatedApps = [...existingApps, newApp]
      localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

      toast.success(`Successfully created OAuth app "${data.name}"`)
      onSuccess(newApp)

      // Close the create modal first, then show credentials
      closeModal()

      // Show credentials modal after a brief delay
      setTimeout(() => {
        setGeneratedCredentials({ clientId: client_id, clientSecret: client_secret })
        setShowCredentialsModal(true)
      }, 100)
    } catch (error) {
      toast.error('Failed to create OAuth app')
      console.error('Error creating OAuth app:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const closeModal = () => {
    form.reset(initialValues)
    onClose()
  }

  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false)
    setGeneratedCredentials(null)
  }

  return (
    <Fragment>
      <Modal
        hideFooter
        size="large"
        visible={visible}
        onCancel={closeModal}
        header="Create a new OAuth app"
      >
        <Form_Shadcn_ {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Modal.Content className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
                    label="Name"
                    // description=""
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="My OAuth App" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

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
                        <MultiSelectorTrigger label="Select scopes..." showIcon={false} />
                        <MultiSelectorContent>
                          <MultiSelectorList>
                            {OAUTH_APP_SCOPES_OPTIONS.map(
                              (scope: { value: string; name: string }) => (
                                <MultiSelectorItem key={scope.value} value={scope.value}>
                                  {scope.name}
                                </MultiSelectorItem>
                              )
                            )}
                          </MultiSelectorList>
                        </MultiSelectorContent>
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
                                    placeholder="https://example.com/callback"
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
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="flex items-center justify-end space-x-2">
              <Button type="default" disabled={isCreating} onClick={closeModal}>
                Cancel
              </Button>
              <Button htmlType="submit" disabled={isCreating} loading={isCreating}>
                Create app
              </Button>
            </Modal.Content>
            <Button ref={submitRef} htmlType="submit" type="default" className="hidden">
              Create
            </Button>
          </form>
        </Form_Shadcn_>
      </Modal>

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

export default CreateOAuthAppModal
