import { zodResolver } from '@hookform/resolvers/zod'
import type { CreateOAuthClientParams, OAuthClient } from '@supabase/supabase-js'
import { Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useOAuthServerAppCreateMutation } from 'data/oauth-server-apps/oauth-server-app-create-mutation'
import { useSupabaseClientQuery } from 'hooks/use-supabase-client-query'
import {
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
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
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface CreateOAuthAppSheetProps {
  visible: boolean
  onSuccess: (app: OAuthClient) => void
  onCancel: () => void
}

const FormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please provide a name for your OAuth app')
    .max(100, 'Name must be less than 100 characters'),
  type: z.enum(['manual', 'dynamic']).default('manual'),
  // scope: z.string().min(1, 'Please select a scope'),
  redirect_uris: z
    .object({
      value: z.string().trim().url('Please provide a valid URL'),
    })
    .array()
    .min(1, 'At least one redirect URI is required'),
  is_public: z.boolean().default(false),
})

const FORM_ID = 'create-or-update-oauth-app-form'

const initialValues = {
  name: '',
  type: 'manual' as const,
  // scope: 'email',
  redirect_uris: [{ value: '' }],
  is_public: false,
}

export const CreateOAuthAppSheet = ({ visible, onSuccess, onCancel }: CreateOAuthAppSheetProps) => {
  const { ref: projectRef } = useParams()

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

  const { mutateAsync: createOAuthApp, isLoading: isCreating } = useOAuthServerAppCreateMutation({
    onSuccess: (data) => {
      toast.success(`Successfully created OAuth app "${data.client_name}"`)
      onSuccess(data)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  useEffect(() => {
    if (visible) {
      form.reset(initialValues)
    }
  }, [visible])

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    // Filter out empty redirect URIs
    const validRedirectUris = data.redirect_uris
      .map((uri) => uri.value.trim())
      .filter((uri) => uri !== '')

    const payload: CreateOAuthClientParams = {
      client_name: data.name,
      client_uri: '',
      // scope: data.scope,
      redirect_uris: validRedirectUris,
    }

    createOAuthApp({
      projectRef,
      supabaseClient: supabaseClientData?.supabaseClient,
      ...payload,
    })
  }

  const onClose = () => {
    form.reset(initialValues)
    onCancel()
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={() => onCancel()}>
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
                    <FormItemLayout label="Name" className={'px-5'}>
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} placeholder="My OAuth App" />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {/* <FormField_Shadcn_
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
                      className={'px-5'}
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
                /> */}

                <div className="px-5 gap-2 flex flex-col">
                  <FormLabel_Shadcn_ className="text-foreground">Redirect URIs</FormLabel_Shadcn_>

                  <div className="space-y-2">
                    {redirectUriFields.map((fieldItem, index) => (
                      <FormField_Shadcn_
                        control={form.control}
                        key={fieldItem.id}
                        name={`redirect_uris.${index}.value`}
                        render={({ field: inputField }) => (
                          <FormItem_Shadcn_>
                            <div className="flex flex-row gap-2">
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...inputField}
                                  placeholder={'https://example.com/callback'}
                                  onChange={(e) => {
                                    inputField.onChange(e)
                                  }}
                                />
                              </FormControl_Shadcn_>
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
                            <FormMessage_Shadcn_ />
                          </FormItem_Shadcn_>
                        )}
                      />
                    ))}
                  </div>
                  <div>
                    <Button
                      type="default"
                      icon={<Plus strokeWidth={1.5} />}
                      onClick={() => appendRedirectUri({ value: '' })}
                    >
                      Add redirect URI
                    </Button>
                  </div>
                  <FormDescription_Shadcn_ className="text-foreground-lighter">
                    URLs where users will be redirected after authentication.
                  </FormDescription_Shadcn_>
                </div>

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
                      className={'px-5'}
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
            <Button type="default" disabled={isCreating} onClick={onClose}>
              Cancel
            </Button>
            <Button htmlType="submit" form={FORM_ID} loading={isCreating}>
              Create app
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
