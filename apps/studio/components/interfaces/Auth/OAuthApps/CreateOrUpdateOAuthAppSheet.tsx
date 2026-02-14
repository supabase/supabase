import { zodResolver } from '@hookform/resolvers/zod'
import type {
  CreateOAuthClientParams,
  OAuthClient,
  UpdateOAuthClientParams,
} from '@supabase/supabase-js'
import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import Panel from 'components/ui/Panel'
import { useProjectEndpointQuery } from 'data/config/project-endpoint-query'
import { useOAuthServerAppCreateMutation } from 'data/oauth-server-apps/oauth-server-app-create-mutation'
import { useOAuthServerAppRegenerateSecretMutation } from 'data/oauth-server-apps/oauth-server-app-regenerate-secret-mutation'
import { useOAuthServerAppUpdateMutation } from 'data/oauth-server-apps/oauth-server-app-update-mutation'
import { DOCS_URL } from 'lib/constants'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
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
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

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
  const uploadButtonRef = useRef<HTMLInputElement>(null)

  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false)
  const [logoFile, setLogoFile] = useState<File>()
  const [logoUrl, setLogoUrl] = useState<string>()
  const [logoRemoved, setLogoRemoved] = useState(false)

  const isEditMode = !!appToEdit
  const hasLogo = logoUrl !== undefined
  const isPublicClient = appToEdit?.client_type === 'public'

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

  const { data: endpointData } = useProjectEndpointQuery({ projectRef })

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
    if (visible) {
      setLogoFile(undefined)
      setLogoRemoved(false)
      if (appToEdit) {
        form.reset({
          name: appToEdit.client_name,
          type: 'manual' as const,
          redirect_uris:
            appToEdit.redirect_uris && appToEdit.redirect_uris.length > 0
              ? appToEdit.redirect_uris.map((uri) => ({ value: uri }))
              : [{ value: '' }],
          client_type: appToEdit.client_type,
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

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setLogoFile(file)
      setLogoUrl(URL.createObjectURL(file))
      setLogoRemoved(false)
      event.target.value = ''
    }
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const validRedirectUris = data.redirect_uris
      .map((uri) => uri.value.trim())
      .filter((uri) => uri !== '')

    let uploadedLogoUri: string | undefined = undefined

    if (logoRemoved) {
      uploadedLogoUri = ''
    } else if (logoFile) {
      const reader = new FileReader()
      uploadedLogoUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(logoFile)
      })
    } else if (logoUrl) {
      uploadedLogoUri = logoUrl
    }

    if (isEditMode && appToEdit) {
      const payload: UpdateOAuthClientParams = {
        client_name: data.name,
        redirect_uris: validRedirectUris,
        logo_uri: uploadedLogoUri,
      }

      updateOAuthApp({
        projectRef,
        clientId: appToEdit.client_id,
        clientEndpoint: endpointData?.endpoint,
        ...payload,
      })
    } else {
      const payload: CreateOAuthClientParams & { logo_uri?: string; client_type?: string } = {
        client_name: data.name,
        client_uri: '',
        client_type: data.client_type,
        redirect_uris: validRedirectUris,
        logo_uri: uploadedLogoUri || undefined,
      }

      createOAuthApp({
        projectRef,
        clientEndpoint: endpointData?.endpoint,
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
      clientId: appToEdit?.client_id,
      clientEndpoint: endpointData?.endpoint,
    })
  }

  const handleUploadLogo = () => uploadButtonRef.current?.click()
  const handleRemoveLogo = () => {
    setLogoFile(undefined)
    setLogoUrl(undefined)
    setLogoRemoved(true)
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={() => onCancel()}>
        <SheetContent
          size="lg"
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
              <SheetTitle className="truncate">
                {isEditMode ? 'Update OAuth app' : 'Create a new OAuth app'}
              </SheetTitle>
            </div>
          </SheetHeader>
          <SheetSection className="overflow-auto flex-grow px-0">
            <Form_Shadcn_ {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} id={FORM_ID}>
                <div className="px-5 flex items-start justify-between gap-4">
                  <div className="flex-grow space-y-4">
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
                    <FormField_Shadcn_
                      control={form.control}
                      name="logo_uri"
                      render={() => (
                        <FormItemLayout label="Logo" description="Upload a logo for your OAuth app">
                          <FormControl_Shadcn_>
                            <div className="flex gap-4 items-center">
                              <button
                                type="button"
                                onClick={handleUploadLogo}
                                className={cn(
                                  'flex items-center justify-center h-10 w-10 shrink-0 text-foreground-lighter hover:text-foreground-light overflow-hidden rounded-full bg-cover border hover:border-strong'
                                )}
                                style={{
                                  backgroundImage: logoUrl ? `url("${logoUrl}")` : 'none',
                                }}
                              >
                                {!hasLogo && <Upload size={14} />}
                              </button>
                              <div className="flex gap-2 items-center">
                                <Button
                                  type="default"
                                  size="tiny"
                                  icon={<Upload size={14} />}
                                  onClick={handleUploadLogo}
                                >
                                  Upload
                                </Button>
                                {hasLogo && (
                                  <Button
                                    type="default"
                                    size="tiny"
                                    icon={<Trash2 size={12} />}
                                    onClick={handleRemoveLogo}
                                  />
                                )}
                              </div>
                              <input
                                type="file"
                                ref={uploadButtonRef}
                                className="hidden"
                                accept="image/png, image/jpeg"
                                onChange={onFileUpload}
                              />
                            </div>
                          </FormControl_Shadcn_>
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
                          <FormField_Shadcn_
                            control={form.control}
                            name="client_id"
                            render={() => (
                              <FormItemLayout label="Client ID">
                                <FormControl_Shadcn_>
                                  <Input
                                    copy
                                    readOnly
                                    className="input-mono"
                                    value={appToEdit.client_id}
                                    onChange={() => {}}
                                    onCopy={() => toast.success('Client ID copied to clipboard')}
                                  />
                                </FormControl_Shadcn_>
                              </FormItemLayout>
                            )}
                          />

                          {!isPublicClient && (
                            <>
                              <FormField_Shadcn_
                                control={form.control}
                                name="client_secret"
                                render={() => (
                                  <FormItemLayout
                                    label="Client Secret"
                                    description="Client secret is hidden for security. Use the regenerate button to create a new one."
                                  >
                                    <FormControl_Shadcn_>
                                      <Input
                                        readOnly
                                        type="password"
                                        className="input-mono"
                                        value="****************************************************************"
                                        onChange={() => {}}
                                      />
                                    </FormControl_Shadcn_>
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
                                  icon={<Trash2 size={12} />}
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
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value === 'public'}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? 'public' : 'confidential')
                          }
                          disabled={isEditMode}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </form>
            </Form_Shadcn_>
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
