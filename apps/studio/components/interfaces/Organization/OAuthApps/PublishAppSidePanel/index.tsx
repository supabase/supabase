import { zodResolver } from '@hookform/resolvers/zod'
import type { OAuthScope } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Edit, Upload } from 'lucide-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormField,
  Input_Shadcn_,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Modal,
  SidePanel,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { AuthorizeRequesterDetails } from '../AuthorizeRequesterDetails'
import { OAuthSecrets } from '../OAuthSecrets/OAuthSecrets'
import { ScopesPanel } from './Scopes'
import { DocsButton } from '@/components/ui/DocsButton'
import {
  OAuthAppCreateResponse,
  useOAuthAppCreateMutation,
} from '@/data/oauth/oauth-app-create-mutation'
import { useOAuthAppUpdateMutation } from '@/data/oauth/oauth-app-update-mutation'
import type { OAuthApp } from '@/data/oauth/oauth-apps-query'
import { DOCS_URL } from '@/lib/constants'
import { isValidHttpUrl, uuidv4 } from '@/lib/helpers'
import { uploadAttachment } from '@/lib/upload'

export interface PublishAppSidePanelProps {
  visible: boolean
  selectedApp?: OAuthApp
  onClose: () => void
  onCreateSuccess: (app: OAuthAppCreateResponse) => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Please provide a name for your application'),
  website: z
    .string()
    .min(1, 'Please provide a URL for your site')
    .url('Please provide a URL for your site')
    .refine((value) => isValidHttpUrl(value), 'Please provide a valid URL for your site'),
  redirect_uris: z
    .array(
      z.object({
        id: z.string(),
        value: z.string().min(1, 'Please provide a URL').url('Please provide a URL'),
      }),
      { required_error: 'Please provide at least one callback URL' }
    )
    .min(1, 'Please provide at least one callback URL'),
})

const getFormDefaultValues = (selectedApp: OAuthApp | undefined) => {
  if (selectedApp) {
    return {
      name: selectedApp.name,
      website: selectedApp.website,
      redirect_uris:
        selectedApp.redirect_uris?.map((url) => {
          return { id: uuidv4(), value: url }
        }) ?? [],
    }
  }

  return { name: '', website: '', redirect_uris: [{ id: uuidv4(), value: '' }] }
}

type FormSchema = z.infer<typeof formSchema>

export const PublishAppSidePanel = ({
  visible,
  selectedApp,
  onClose,
  onCreateSuccess,
}: PublishAppSidePanelProps) => {
  const { slug } = useParams()
  const uploadButtonRef = useRef<HTMLInputElement | null>(null)

  const { mutateAsync: createOAuthApp } = useOAuthAppCreateMutation({
    onSuccess: (res, variables) => {
      toast.success(`Successfully created OAuth app "${variables.name}"!`)
      onClose()
      onCreateSuccess(res)
    },
    onError: (error) => {
      toast.error(`Failed to create OAuth application: ${error.message}`)
    },
  })
  const { mutateAsync: updateOAuthApp } = useOAuthAppUpdateMutation({
    onSuccess: (_, variables) => {
      toast.success(`Successfully updated OAuth app "${variables.name}"!`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to update OAuth application: ${error.message}`)
    },
  })

  const [showPreview, setShowPreview] = useState(false)
  const [iconFile, setIconFile] = useState<File>()
  const [iconUrl, setIconUrl] = useState<string>()
  const [scopes, setScopes] = useState<OAuthScope[]>([])

  useEffect(() => {
    if (visible) {
      setIconFile(undefined)

      if (selectedApp !== undefined) {
        setScopes((selectedApp?.scopes ?? []) as OAuthScope[])
        setIconUrl(selectedApp.icon === null ? undefined : selectedApp.icon)
      } else {
        setScopes([])
        setIconUrl(undefined)
      }
    }
  }, [visible, selectedApp])

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const [file] = event.target.files || (event as any).dataTransfer.items
    setIconFile(file)
    setIconUrl(URL.createObjectURL(file))
    event.target.value = ''
  }

  const onSubmit: SubmitHandler<FormSchema> = async (values) => {
    if (!slug) return console.error('Slug is required')

    const { name, website, redirect_uris } = values
    const uploadedIconUrl =
      iconFile !== undefined
        ? await uploadAttachment('oauth-app-icons', `${slug}/${uuidv4()}.png`, iconFile)
        : iconUrl

    if (iconFile !== undefined && uploadedIconUrl === undefined) {
      toast.error('Failed to upload OAuth application icon')
      return
    }

    try {
      if (selectedApp === undefined) {
        // Create application
        await createOAuthApp({
          slug,
          name,
          website,
          redirect_uris: redirect_uris.map((uris) => uris.value),
          scopes,
          icon: uploadedIconUrl,
        })
      } else {
        // Update application
        await updateOAuthApp({
          id: selectedApp.id,
          slug,
          name,
          website,
          redirect_uris: redirect_uris.map((uris) => uris.value),
          scopes,
          icon: uploadedIconUrl,
        })
      }
    } catch {
      // Error side effects are handled in the mutation hook options
    }
  }

  const form = useForm<FormSchema>({
    defaultValues: getFormDefaultValues(selectedApp),
    resolver: zodResolver(formSchema),
  })
  const { reset } = form
  const { errors, isSubmitting } = form.formState

  useEffect(() => {
    if (visible) {
      const defaultValues = getFormDefaultValues(selectedApp)
      reset(defaultValues)
    }
  }, [visible, selectedApp, reset])

  const name = useWatch({ name: 'name', control: form.control })
  const website = useWatch({ name: 'website', control: form.control })

  const {
    fields: callbackUrlsFields,
    append: appendCallbackUrl,
    remove: removeCallbackUrl,
  } = useFieldArray({
    name: 'redirect_uris',
    control: form.control,
  })

  return (
    <SidePanel
      hideFooter
      size="large"
      visible={visible}
      header={
        selectedApp !== undefined ? 'Update OAuth application' : 'Publish a new OAuth application'
      }
      onCancel={() => onClose()}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="h-full flex flex-col">
            <div className="grow">
              <SidePanel.Content>
                <div className="py-4 flex items-start justify-between gap-10">
                  <div className="space-y-4 w-full">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="vertical"
                          label="Application name"
                          description={selectedApp?.id && `ID: ${selectedApp.id}`}
                        >
                          <FormControl className="col-span-6">
                            <Input_Shadcn_ {...field} />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItemLayout layout="vertical" label="Website URL">
                          <FormControl className="col-span-6">
                            <Input_Shadcn_ {...field} placeholder="https://my-website.com" />
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  </div>
                  <div>
                    {iconUrl !== undefined ? (
                      <div
                        className={cn(
                          'shadow-sm transition group relative',
                          'bg-center bg-cover bg-no-repeat',
                          'mt-4 mr-4 space-y-2 rounded-full h-[120px] w-[120px] flex flex-col items-center justify-center'
                        )}
                        style={{
                          backgroundImage: iconUrl ? `url("${iconUrl}")` : 'none',
                        }}
                      >
                        <div className="absolute bottom-1 right-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1">
                                <Edit />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom">
                              <DropdownMenuItem
                                key="upload"
                                onClick={() => {
                                  if (uploadButtonRef.current)
                                    (uploadButtonRef.current as any).click()
                                }}
                              >
                                <p>Upload image</p>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                key="remove"
                                onClick={() => {
                                  setIconFile(undefined)
                                  setIconUrl(undefined)
                                }}
                              >
                                <p>Remove image</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'border border-strong transition opacity-75 hover:opacity-100',
                          'mt-4 mr-4 space-y-2 rounded-full h-[120px] w-[120px] flex flex-col items-center justify-center cursor-pointer'
                        )}
                        onClick={() => {
                          if (uploadButtonRef.current) (uploadButtonRef.current as any).click()
                        }}
                      >
                        <Upload size={18} strokeWidth={1.5} className="text-foreground" />
                        <p className="text-xs text-foreground-light">Upload logo</p>
                      </div>
                    )}
                    <input
                      multiple
                      type="file"
                      ref={uploadButtonRef}
                      className="hidden"
                      accept="image/png, image/jpeg"
                      onChange={onFileUpload}
                    />
                  </div>
                </div>
              </SidePanel.Content>

              <SidePanel.Separator />

              <SidePanel.Content className="py-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-sm">Authorization callback URLs</p>
                    <p className="text-sm text-foreground-light">
                      All URLs must use HTTPS, except for localhost
                    </p>
                  </div>
                  <Button
                    type="default"
                    onClick={() => appendCallbackUrl({ id: uuidv4(), value: '' })}
                  >
                    Add URL
                  </Button>
                </div>
                <div className="space-y-2 pb-2">
                  {callbackUrlsFields.map((url, index) => (
                    <FormField
                      key={url.id}
                      control={form.control}
                      name={`redirect_uris.${index}.value`}
                      render={({ field }) => (
                        <FormItemLayout
                          layout="vertical"
                          label={<span className="sr-only">Callback URL</span>}
                        >
                          <FormControl>
                            <InputGroup>
                              <InputGroupInput
                                {...field}
                                placeholder="e.g https://my-website.com"
                              />
                              {callbackUrlsFields.length > 1 ? (
                                <InputGroupAddon align="inline-end">
                                  <InputGroupButton
                                    type="default"
                                    onClick={() => removeCallbackUrl(index)}
                                  >
                                    Remove
                                  </InputGroupButton>
                                </InputGroupAddon>
                              ) : null}
                            </InputGroup>
                          </FormControl>
                        </FormItemLayout>
                      )}
                    />
                  ))}
                  {errors.redirect_uris?.root != null ? (
                    <p className="text-red-900 text-sm">{errors.redirect_uris?.root.message}</p>
                  ) : null}
                </div>
              </SidePanel.Content>

              {selectedApp !== undefined && (
                <>
                  <SidePanel.Separator />
                  <SidePanel.Content className="py-4">
                    <OAuthSecrets selectedApp={selectedApp} />
                  </SidePanel.Content>
                </>
              )}

              <SidePanel.Separator />
              <div className="p-6 ">
                <div className="flex items-start justify-between space-x-4 pb-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">Application permissions</span>
                    <span className="text-sm text-foreground-light">
                      The application permissions are organized in scopes and will be presented to
                      the user when adding an app to their organization and all of its projects.
                    </span>
                  </div>
                  <DocsButton href={`${DOCS_URL}/guides/platform/oauth-apps/oauth-scopes`} />
                </div>

                <ScopesPanel scopes={scopes} setScopes={setScopes} />
              </div>
            </div>

            <SidePanel.Separator />

            <SidePanel.Content>
              <div className="pt-2 pb-3 flex items-center justify-between">
                <Button
                  type="default"
                  onClick={() => setShowPreview(true)}
                  disabled={name.length === 0 || website.length === 0}
                >
                  Preview consent for users
                </Button>
                <div className="flex items-center space-x-2">
                  <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
                    Cancel
                  </Button>
                  <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                    Confirm
                  </Button>
                </div>
              </div>
            </SidePanel.Content>
          </div>

          <Modal
            hideFooter
            showCloseButton={false}
            className="max-w-[600px]!"
            visible={showPreview}
            onCancel={() => setShowPreview(false)}
          >
            <Modal.Content>
              <div className="flex items-center gap-x-2 justify-between">
                <p className="truncate">Authorize API access for {name}</p>
                <Badge variant="success">Preview</Badge>
              </div>
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content>
              <AuthorizeRequesterDetails
                icon={iconUrl || null}
                name={name}
                domain={website}
                scopes={scopes}
              />
              <div className="pt-4 space-y-2">
                <p className="prose text-sm">Select an organization to grant API access to</p>
                <div className="border border-control text-foreground-light rounded-sm px-4 py-2 text-sm bg-surface-200">
                  Organizations that you have access to will be listed here
                </div>
              </div>
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content>
              <div className="flex items-center justify-between">
                <p className="prose text-xs">
                  This is what your users will see when authorizing with your app
                </p>
                <Button type="default" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
            </Modal.Content>
          </Modal>
        </form>
      </Form>
    </SidePanel>
  )
}
