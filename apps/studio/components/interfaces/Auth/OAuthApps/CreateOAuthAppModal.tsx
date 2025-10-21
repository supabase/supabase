import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateOAuthClientParams } from '@supabase/supabase-js'
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
import { OAUTH_APP_SCOPE_OPTIONS } from './OAuthAppsList'

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
  redirect_uris: z.array(
    z.object({
      value: z.string(),
    })
  ),
  is_public: z.boolean().default(false),
})

const initialValues = {
  name: '',
  type: 'manual' as const,
  scope: 'email',
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
  const [redirectUriErrors, setRedirectUriErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    form.reset(initialValues)
    setRedirectUriErrors([])
    setFieldErrors({})
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

  const { data: supabaseClientData } = useSupabaseClientQuery({ projectRef })

  const { mutateAsync: createOAuthApp, isLoading } = useOAuthServerAppCreateMutation({
    onSuccess: (data) => {
      if (data) {
        toast.success(`Successfully created OAuth app "${data.client_name}"`)
        setGeneratedCredentials({
          clientId: data.client_id ?? '',
          clientSecret: data.client_secret ?? '',
        })
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const validateRedirectUris = (uris: { value: string }[]) => {
    const errors: string[] = []
    const fieldErrorMap: { [key: number]: string } = {}

    if (uris.length === 0) {
      errors.push('At least one redirect URI is required')
      return { errors, fieldErrors: fieldErrorMap }
    }

    const validUris = uris.filter((uri) => uri.value.trim() !== '')
    if (validUris.length === 0) {
      errors.push('At least one redirect URI must be provided')
      return { errors, fieldErrors: fieldErrorMap }
    }

    // Validate each URI and track field-level errors
    uris.forEach((uri, index) => {
      if (uri.value.trim() !== '') {
        try {
          new URL(uri.value.trim())
        } catch {
          fieldErrorMap[index] = 'Please provide a valid URL'
        }
      }
    })

    return { errors, fieldErrors: fieldErrorMap }
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    // Validate redirect URIs
    const { errors: uriErrors, fieldErrors: newFieldErrors } = validateRedirectUris(
      data.redirect_uris
    )
    setRedirectUriErrors(uriErrors)
    setFieldErrors(newFieldErrors)

    if (uriErrors.length > 0 || Object.keys(newFieldErrors).length > 0) {
      return
    }

    // Filter out empty redirect URIs
    const validRedirectUris = data.redirect_uris
      .map((uri) => uri.value.trim())
      .filter((uri) => uri !== '')

    try {
      const payload: CreateOAuthClientParams = {
        client_name: data.name,
        client_uri: '',
        scope: data.scope,
        redirect_uris: validRedirectUris,
      }

      await createOAuthApp({
        projectRef,
        supabaseClient: supabaseClientData?.supabaseClient,
        temporaryApiKey: supabaseClientData?.temporaryApiKey,
        ...payload,
      })

      // Close the create modal first, then show credentials
      closeModal()

      // Show credentials modal after a brief delay
      setTimeout(() => {
        setShowCredentialsModal(true)
      }, 100)
    } catch (error) {
      console.error('Error creating OAuth app:', error)
    }
  }

  const closeModal = () => {
    form.reset(initialValues)
    setRedirectUriErrors([])
    setFieldErrors({})
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
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormItemLayout
                      label="Scope"
                      layout="vertical"
                      description={
                        <>
                          Select the permissions your app will request from users.{' '}
                          <Link
                            href="https://supabase.com/docs/guides/auth/oauth/oauth-apps#scope"
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
                            {OAUTH_APP_SCOPE_OPTIONS.map((scope) => (
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
                        {redirectUriFields.map((fieldItem, index) => (
                          <FormField_Shadcn_
                            control={form.control}
                            key={fieldItem.id}
                            name={`redirect_uris.${index}.value`}
                            render={({ field: inputField }) => (
                              <FormItem_Shadcn_>
                                <FormControl_Shadcn_>
                                  <div className="flex items-center space-x-2">
                                    <Input_Shadcn_
                                      {...inputField}
                                      placeholder="https://example.com/callback"
                                      className="flex-1"
                                      onChange={(e) => {
                                        inputField.onChange(e)
                                        if (redirectUriErrors.length > 0) {
                                          setRedirectUriErrors([])
                                        }
                                        if (fieldErrors[index]) {
                                          setFieldErrors((prev) => {
                                            const newErrors = { ...prev }
                                            delete newErrors[index]
                                            return newErrors
                                          })
                                        }
                                      }}
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
                                {fieldErrors[index] && (
                                  <div className="text-sm text-destructive mt-1">
                                    {fieldErrors[index]}
                                  </div>
                                )}
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
                      {redirectUriErrors.length > 0 && (
                        <div className="text-sm text-destructive mt-2">
                          {redirectUriErrors.map((error) => (
                            <div key={`redirect-uri-error-${error}`}>{error}</div>
                          ))}
                        </div>
                      )}
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
