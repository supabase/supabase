import { zodResolver } from '@hookform/resolvers/zod'
import { type CreateOAuthClientParams } from '@supabase/supabase-js'
import { Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useParams } from 'common'
import { useOAuthServerAppCreateMutation } from 'data/oauth-server-apps/oauth-server-app-create-mutation'
import { useSupabaseClientQuery } from 'hooks/use-supabase-client-query'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  cn,
} from 'ui'
import OAuthAppCredentialsModal from './OAuthAppCredentialsModal'
import { OAUTH_APP_SCOPES_OPTIONS } from './OAuthAppsList'

interface CreateOAuthAppModalProps {
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please provide a name for your OAuth app')
    .max(100, 'Name must be less than 100 characters')
    .default(''),
  type: z.enum(['manual', 'dynamic']).default('manual'),
  scope: z.string().min(1, 'Please select a scope').default('profile'),
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

const initialValues = {
  name: '',
  type: 'manual' as const,
  scopes: ['email', 'profile'],
  redirect_uris: [{ value: '' }],
  is_public: false,
}

const FORM_ID = 'create-oauth-app-form'

export const CreateOAuthAppModal = ({ visible, onClose }: CreateOAuthAppModalProps) => {
  const { ref: projectRef } = useParams()

  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    clientId: string
    clientSecret: string
  } | null>(null)

  useEffect(() => {
    form.reset(initialValues)
  }, [visible])

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

  const { data: supabaseClientData } = useSupabaseClientQuery({ projectRef })

  const { mutateAsync: createOAuthApp, isLoading } = useOAuthServerAppCreateMutation()

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      // Generate a unique ID and client_id
      const id = Date.now().toString()
      const client_id = `oauth_${id}`
      const client_secret = generateClientSecret()

      const payload: CreateOAuthClientParams = {
        client_name: data.name,
        client_uri: '',
        scope: data.scope,
        redirect_uris: data.redirect_uris
          .filter((uri) => uri.value.trim())
          .map((uri) => uri.value.trim()),
      }

      await createOAuthApp({
        projectRef,
        supabaseClient: supabaseClientData?.supabaseClient,
        ...payload,
      })

      toast.success(`Successfully created OAuth app "${data.name}"`)

      // Close the create modal first, then show credentials
      closeModal()

      // Show credentials modal after a brief delay
      setTimeout(() => {
        setGeneratedCredentials({ clientId: client_id, clientSecret: client_secret })
        setShowCredentialsModal(true)
      }, 100)
    } catch (error) {
      console.error('Error creating OAuth app:', error)
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
      <Sheet open={visible} onOpenChange={() => onClose()}>
        <SheetContent
          size="default"
          showClose={false}
          className="flex flex-col gap-0"
          tabIndex={undefined}
        >
          <SheetHeader>
            <div className="flex flex-row gap-3 items-center">
              <SheetClose
                className={cn(
                  'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'disabled:pointer-events-none data-[state=open]:bg-secondary',
                  'transition'
                )}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </SheetClose>
              <SheetTitle className="truncate">Create a new OAuth app</SheetTitle>
            </div>
          </SheetHeader>
          <SheetSection className="overflow-auto flex-grow px-0">
            <Form_Shadcn_ {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} id={FORM_ID}>
                <FormField_Shadcn_
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItemLayout label="Name" className="px-5">
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} placeholder="My OAuth App" />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Scope"
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
                      className="px-5"
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
                      className="px-5"
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
                                        className="h-[34px]"
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
                      className="px-5"
                    >
                      <FormControl_Shadcn_>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </form>
            </Form_Shadcn_>
          </SheetSection>
          <SheetFooter>
            <Button type="default" disabled={isLoading} onClick={closeModal}>
              Cancel
            </Button>
            <Button htmlType="submit" form={FORM_ID} loading={isLoading}>
              Create app
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
