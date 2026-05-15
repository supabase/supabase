import { zodResolver } from '@hookform/resolvers/zod'
import type {
  CreateOAuthClientParams,
  OAuthClient,
  UpdateOAuthClientParams,
} from '@supabase/supabase-js'
import { useParams } from 'common'
import { Storage } from 'icons'
import { ImageOff, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'
import * as z from 'zod'

import { LogoPicker } from './LogoPicker'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useOAuthServerAppCreateMutation } from '@/data/oauth-server-apps/oauth-server-app-create-mutation'
import { useOAuthServerAppRegenerateSecretMutation } from '@/data/oauth-server-apps/oauth-server-app-regenerate-secret-mutation'
import { useOAuthServerAppUpdateMutation } from '@/data/oauth-server-apps/oauth-server-app-update-mutation'
import { DOCS_URL } from '@/lib/constants'

interface CreateOrUpdateOAuthAppSheetProps {
  visible: boolean
  appToEdit?: OAuthClient
  onSuccess: (app: OAuthClient) => void
  onCancel: () => void
}

const FormSchema = z.object({
  name: z
    .string()
    .min(1, 'Please provide a name for your OAuth app')
    .max(100, 'Name must be less than 100 characters'),
  type: z.enum(['manual', 'dynamic']).default('manual'),
  redirect_uris: z
    .object({
      value: z.string().trim().url('Please provide a valid URL'),
    })
    .array()
    .min(1, 'At least one redirect URI is required'),
  client_type: z.enum(['public', 'confidential']).default('confidential'),
  token_endpoint_auth_method: z
    .enum(['client_secret_basic', 'client_secret_post', 'none'])
    .default('client_secret_basic'),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  logo_uri: z.string().optional(),
})

const FORM_ID = 'create-or-update-oauth-app-form'

const initialValues = {
  name: '',
  type: 'manual' as const,
  redirect_uris: [{ value: '' }],
  client_type: 'confidential' as const,
  token_endpoint_auth_method: 'client_secret_basic' as const,
  client_id: '',
  client_secret: '',
  logo_uri: '',
}

export const CreateOrUpdateOAuthAppSheet = ({
  visible,
  appToEdit,
  onSuccess,
  onCancel,
}: CreateOrUpdateOAuthAppSheetProps) => {
  const { ref: projectRef } = useParams()

  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [storagePickerOpen, setStoragePickerOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>()

  const isEditMode = !!appToEdit
  const hasLogo = logoUrl !== undefined
  const isPublicClient = appToEdit?.client_type === 'public'

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  const { hostEndpoint: clientEndpoint } = useProjectApiUrl({ projectRef })

  const { mutate: createOAuthApp, isPending: isCreating } = useOAuthServerAppCreateMutation({
    onSuccess: (data) => {
      toast.success(`Successfully created OAuth app "${data.client_name}"`)
      onSuccess(data)
    },
  })
  const { mutate: updateOAuthApp, isPending: isUpdating } = useOAuthServerAppUpdateMutation({
    onSuccess: (data) => {
      toast.success(`Successfully updated OAuth app "${data.client_name}"`)
      onSuccess(data)
    },
  })
  const { mutate: regenerateSecret, isPending: isRegenerating } =
    useOAuthServerAppRegenerateSecretMutation({
      onSuccess: (data) => {
        if (data) {
          toast.success(`Successfully regenerated client secret for "${appToEdit?.client_name}"`)
          onSuccess(data)
          setShowRegenerateDialog(false)
        }
      },
    })

  useEffect(() => {
    if (!visible) {
      setStoragePickerOpen(false)
    }
  }, [visible])

  useEffect(() => {
    if (visible) {
      if (appToEdit) {
        form.reset({
          name: appToEdit.client_name,
          type: 'manual' as const,
          redirect_uris:
            appToEdit.redirect_uris && appToEdit.redirect_uris.length > 0
              ? appToEdit.redirect_uris.map((uri) => ({ value: uri }))
              : [{ value: '' }],
          client_type: appToEdit.client_type,
          token_endpoint_auth_method:
            (appToEdit.token_endpoint_auth_method as
              | 'client_secret_basic'
              | 'client_secret_post'
              | 'none') || 'client_secret_basic',
          client_id: appToEdit.client_id,
          client_secret: '****************************************************************',
          logo_uri: appToEdit.logo_uri || undefined,
        })
        setLogoUrl(appToEdit.logo_uri || undefined)
      } else {
        form.reset(initialValues)
        setLogoUrl(undefined)
      }
    }
  }, [visible, appToEdit, form])

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const validRedirectUris = data.redirect_uris
      .map((uri) => uri.value.trim())
      .filter((uri) => uri !== '')

    const uploadedLogoUri = data.logo_uri?.trim() ?? ''

    if (isEditMode && appToEdit) {
      const payload: UpdateOAuthClientParams & { token_endpoint_auth_method?: string } = {
        client_name: data.name,
        redirect_uris: validRedirectUris,
        logo_uri: uploadedLogoUri,
        token_endpoint_auth_method:
          data.client_type === 'public' ? 'none' : data.token_endpoint_auth_method,
      }

      updateOAuthApp({
        projectRef,
        clientEndpoint,
        clientId: appToEdit.client_id,
        ...payload,
      })
    } else {
      const payload: CreateOAuthClientParams & {
        logo_uri?: string
        client_type?: string
        token_endpoint_auth_method?: string
      } = {
        client_name: data.name,
        client_uri: '',
        client_type: data.client_type,
        redirect_uris: validRedirectUris,
        logo_uri: uploadedLogoUri || undefined,
        token_endpoint_auth_method:
          data.client_type === 'public' ? 'none' : data.token_endpoint_auth_method,
      }

      createOAuthApp({
        projectRef,
        clientEndpoint,
        ...payload,
      })
    }
  }

  const onClose = () => {
    form.reset(initialValues)
    onCancel()
  }

  const handleRegenerateSecret = () => {
    setShowRegenerateDialog(true)
  }

  const handleConfirmRegenerate = () => {
    regenerateSecret({
      projectRef,
      clientEndpoint,
      clientId: appToEdit?.client_id,
    })
  }

  const handlePickLogoFromStorage = (uri: string) => {
    setLogoUrl(uri)
    form.setValue('logo_uri', uri)
  }

  const handleRemoveLogo = () => {
    setLogoUrl(undefined)
    form.setValue('logo_uri', '')
  }

  return (
    <>
      {projectRef ? (
        <LogoPicker
          open={storagePickerOpen}
          onOpenChange={setStoragePickerOpen}
          onSelect={handlePickLogoFromStorage}
        />
      ) : null}
      <Sheet open={visible} onOpenChange={() => onCancel()}>
        <SheetContent
          size="lg"
          showClose={false}
          className="flex flex-col gap-0"
          tabIndex={undefined}
          aria-describedby={undefined}
        >
          <SheetHeader>
            <div className="flex flex-row gap-3 items-center">
              <SheetClose
                className={cn(
                  'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                  'focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'disabled:pointer-events-none data-[state=open]:bg-secondary',
                  'transition'
                )}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </SheetClose>
              <SheetTitle className="truncate">
                {isEditMode ? 'Update OAuth app' : 'Create a new OAuth app'}
              </SheetTitle>
            </div>
          </SheetHeader>
          <SheetSection className="overflow-auto grow px-0">
            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} id={FORM_ID}>
                <div className="px-5 flex items-start justify-between gap-4">
                  <div className="grow space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItemLayout label="Name">
                          <FormControl>
                            <Input_Shadcn_ {...field} placeholder="My OAuth App" />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="logo_uri"
                      render={({ field }) => (
                        <FormItemLayout
                          label="Logo"
                          description={`Paste an absolute image URL/path or select one from a public File Storage bucket.`}
                        >
                          <FormControl>
                            <div className="flex w-full flex-col gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <div
                                  className={cn(
                                    'flex items-center justify-center h-10 w-10 shrink-0 text-foreground-lighter overflow-hidden rounded-full bg-cover border'
                                  )}
                                  title={logoUrl ? undefined : 'No image selected'}
                                  style={{
                                    backgroundImage: logoUrl ? `url("${logoUrl}")` : 'none',
                                  }}
                                >
                                  {!hasLogo && <ImageOff size={14} />}
                                </div>
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                  <div className="group relative min-w-0 flex-1">
                                    <Input_Shadcn_
                                      {...field}
                                      value={field.value ?? ''}
                                      className={cn('flex-1', projectRef ? 'pr-10' : '')}
                                      placeholder="https://example.com/logo.png"
                                      onChange={(event) => {
                                        field.onChange(event)
                                        const next = event.target.value.trim()
                                        setLogoUrl(next.length > 0 ? next : undefined)
                                      }}
                                    />
                                    {projectRef ? (
                                      <Button
                                        type="default"
                                        size="tiny"
                                        icon={<Storage strokeWidth={1.5} />}
                                        className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 justify-center overflow-hidden px-1 transition-all duration-150 group-hover:w-36 group-focus-within:w-36 [&_span]:hidden group-hover:[&_span]:block group-focus-within:[&_span]:block"
                                        onClick={() => setStoragePickerOpen(true)}
                                      >
                                        <span className="hidden whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                                          Select from Storage
                                        </span>
                                      </Button>
                                    ) : null}
                                  </div>
                                  {field.value ? (
                                    <Button
                                      type="default"
                                      size="tiny"
                                      icon={<Trash2 size={12} />}
                                      onClick={handleRemoveLogo}
                                    />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  </div>
                </div>

                {isEditMode && appToEdit && (
                  <>
                    <Separator />
                    <div className="px-5">
                      <Panel>
                        <Panel.Content className="space-y-2">
                          <FormField
                            control={form.control}
                            name="client_id"
                            render={() => (
                              <FormItemLayout label="Client ID">
                                <FormControl>
                                  <Input
                                    copy
                                    readOnly
                                    className="input-mono"
                                    value={appToEdit.client_id}
                                    onChange={() => {}}
                                    onCopy={() => toast.success('Client ID copied to clipboard')}
                                  />
                                </FormControl>
                              </FormItemLayout>
                            )}
                          />

                          {!isPublicClient && (
                            <>
                              <FormField
                                control={form.control}
                                name="client_secret"
                                render={() => (
                                  <FormItemLayout
                                    label="Client Secret"
                                    description="Client secret is hidden for security. Use the regenerate button to create a new one."
                                  >
                                    <FormControl>
                                      <Input
                                        readOnly
                                        type="password"
                                        className="input-mono"
                                        value="****************************************************************"
                                        onChange={() => {}}
                                      />
                                    </FormControl>
                                  </FormItemLayout>
                                )}
                              />

                              <Button
                                type="default"
                                onClick={handleRegenerateSecret}
                                className="w-min"
                                disabled={isRegenerating}
                              >
                                Regenerate client secret
                              </Button>
                            </>
                          )}
                        </Panel.Content>
                      </Panel>
                    </div>
                  </>
                )}

                <div className="px-5 gap-2 flex flex-col">
                  <FormLabel className="text-foreground">Redirect URIs</FormLabel>
                  <SingleValueFieldArray
                    control={form.control}
                    name="redirect_uris"
                    valueFieldName="value"
                    createEmptyRow={() => ({ value: '' })}
                    placeholder="https://example.com/callback"
                    addLabel="Add redirect URI"
                    removeLabel="Remove redirect URI"
                    minimumRows={1}
                    rowsClassName="space-y-2"
                  />
                  <FormDescription className="text-foreground-lighter">
                    URLs where users will be redirected after authentication.
                  </FormDescription>
                </div>

                <Separator />
                <FormField
                  control={form.control}
                  name="client_type"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Public Client"
                      layout="flex"
                      description={
                        <>
                          If enabled, the Authorization Code with PKCE (Proof Key for Code Exchange)
                          flow can be used, particularly beneficial for applications that cannot
                          securely store Client Secrets, such as native and mobile apps. This cannot
                          be changed after creation.{' '}
                          <InlineLink href={`${DOCS_URL}/guides/auth/oauth/public-oauth-apps`}>
                            Learn more
                          </InlineLink>
                        </>
                      }
                      className={'px-5'}
                    >
                      <FormControl>
                        <Switch
                          checked={field.value === 'public'}
                          onCheckedChange={(checked) => {
                            const newType = checked ? 'public' : 'confidential'
                            field.onChange(newType)
                            form.setValue(
                              'token_endpoint_auth_method',
                              newType === 'public' ? 'none' : 'client_secret_basic'
                            )
                          }}
                          disabled={isEditMode}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                {form.watch('client_type') === 'confidential' && (
                  <FormField
                    control={form.control}
                    name="token_endpoint_auth_method"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Token Endpoint Auth Method"
                        description="How the client authenticates with the token endpoint. The client secret is included in either the Authorization header or the request body."
                        className="px-5"
                      >
                        <FormControl>
                          <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger_Shadcn_ className="text-sm">
                              <SelectValue_Shadcn_ />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectItem_Shadcn_ value="client_secret_basic" className="text-sm">
                                HTTP Basic Auth header (client_secret_basic)
                              </SelectItem_Shadcn_>
                              <SelectItem_Shadcn_ value="client_secret_post" className="text-sm">
                                Request body (client_secret_post)
                              </SelectItem_Shadcn_>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                )}
              </form>
            </Form>
          </SheetSection>
          <SheetFooter>
            <Button type="default" disabled={isCreating || isUpdating} onClick={onClose}>
              Cancel
            </Button>
            <Button htmlType="submit" form={FORM_ID} loading={isCreating || isUpdating}>
              {isEditMode ? 'Update app' : 'Create app'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        variant="warning"
        visible={showRegenerateDialog}
        loading={isRegenerating}
        title="Confirm regenerating client secret"
        confirmLabel="Confirm"
        onCancel={() => setShowRegenerateDialog(false)}
        onConfirm={handleConfirmRegenerate}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you wish to regenerate the client secret for "{appToEdit?.client_name}"?
          You'll need to update it in all applications that use it. This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
