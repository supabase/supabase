import { zodResolver } from '@hookform/resolvers/zod'
import { FileX, X } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import z from 'zod'

import { Markdown } from 'components/interfaces/Markdown'
import { useIntegrationDirectoryEntryCreateMutation } from 'data/integrations-directory/integration-directory-entry-create-mutation'
import { useIntegrationDirectoryEntryDeleteMutation } from 'data/integrations-directory/integration-directory-entry-delete-mutation'
import { useIntegrationDirectoryEntryUpdateMutation } from 'data/integrations-directory/integration-directory-entry-update-mutation'
import { IntegrationEntry } from 'data/integrations-directory/integrations-directory-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  ExpandingTextArea,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  SheetClose,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  WarningIcon,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DroppableTextArea } from './DroppableTextArea'
import { LogoFileInput } from './LogoFileInput'
import content from 'pages/api/projects/[ref]/content'

const FORM_ID = 'create-integration-sidepanel'

interface CreateIntegrationSheetProps {
  integrationEntry?: IntegrationEntry
  onChange: (hasChanges: boolean) => void
  onClosing: (ignoreChanges: boolean) => void
}

export const IntegrationCategory = {
  api: 'API',
  auth: 'Auth',
  caching: 'Caching / Offline-First',
  data: 'Data Platform',
  devtools: 'DevTools',
  fdw: 'Foreign Data Wrapper',
  lowcode: 'Low-Code',
  messaging: 'Messaging',
  storage: 'Storage',
} as const

const FormSchema = z.object({
  category: z.enum(
    ['api', 'auth', 'caching', 'data', 'devtools', 'fdw', 'lowcode', 'messaging', 'storage'],
    {
      errorMap: () => {
        return { message: 'Please select one of the provided categories' }
      },
    }
  ),
  description: z.string().trim().min(1, 'The description must be at least 1 character'),
  developer: z.string().trim().min(1, 'The developer must be at least 1 character'),
  docs: z.string().url('The docs must be a valid URL'),
  logo: z.string().url('The logo is missing, please upload an image'),
  overview: z.string().trim().min(1, 'The overview must be at least 1 character'),
  slug: z
    .string()
    .regex(/^[A-Za-z0-9_-]+$/, 'The slug must be alphanumeric and can contain - or _'),
  title: z.string().trim().min(1, 'The title must be at least 1 character'),
  video: z.string().optional(),
  website: z.string().url('The website must be a valid URL'),
})

export const CreateIntegrationSheet = ({
  integrationEntry,
  onChange,
  onClosing,
}: CreateIntegrationSheetProps) => {
  const organization = useSelectedOrganization()
  const [showDeleteDraftDialog, setShowDeleteDraftDialog] = useState(false)

  const isDraft = !!integrationEntry?.parent_id || !!integrationEntry?.id

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      category: integrationEntry?.category ?? undefined,
      description: integrationEntry?.description ?? '',
      developer: integrationEntry?.developer ?? '',
      docs: integrationEntry?.docs ?? '',
      logo: integrationEntry?.logo ?? '',
      overview: integrationEntry?.overview ?? '',
      slug: integrationEntry?.slug ?? '',
      title: integrationEntry?.title ?? '',
      video: integrationEntry?.video ?? '',
      website: integrationEntry?.website ?? '',
    },
  })

  const { mutate: createIntegrationEntry, isLoading: isCreating } =
    useIntegrationDirectoryEntryCreateMutation()
  const { mutate: updateIntegrationEntry, isLoading: isUpdating } =
    useIntegrationDirectoryEntryUpdateMutation()
  const { mutate: deleteIntegrationEntry, isLoading: isDeleting } =
    useIntegrationDirectoryEntryDeleteMutation({
      onSuccess: () => {
        if (showDeleteDraftDialog) {
          toast.success('Successfully discarded draft changes.')
        }

        setShowDeleteDraftDialog(false)
        onClosing(true)
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (isDraft) {
      updateIntegrationEntry(
        {
          orgSlug: organization!.slug,
          params: {
            category: data.category,
            description: data.description,
            developer: data.developer,
            docs: data.docs,
            logo: data.logo,
            overview: data.overview,
            slug: data.slug,
            title: data.title,
            video: data.video,
            website: data.website,
          } as any,
        },
        {
          onSuccess: () => {
            toast.success(`Successfully updated integration`)
            onClosing(true)
          },
        }
      )
    } else {
      createIntegrationEntry(
        {
          orgSlug: organization!.slug,
          params: {
            category: data.category,
            description: data.description,
            developer: data.developer,
            docs: data.docs,
            logo: data.logo,
            overview: data.overview,
            slug: data.slug,
            title: data.title,
            video: data.video,
            website: data.website,
          } as any,
        },
        {
          onSuccess: () => {
            toast.success(`Successfully added an integration entry ${data.slug}`)
            onClosing(true)
          },
        }
      )
    }
  }

  const isLoading = isCreating || isUpdating || isDeleting

  // set a variable in the parent component to indicate if the form has changes. The variable is used to show a
  // confirmation dialog when the user tries to close the sheet.
  form.watch(() => {
    onChange(form.formState.isDirty || !form.formState.isSubmitted)
  })

  return (
    <>
      <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
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
            {isDraft ? `Update integration` : `Add integration`}
          </SheetTitle>
        </div>
      </SheetHeader>
      <Separator />
      <Form_Shadcn_ {...form}>
        <form
          id={FORM_ID}
          className="w-full flex-1 overflow-auto"
          onSubmit={form.handleSubmit(onSubmit)}
          tabIndex={-1}
        >
          <Separator />
          <SheetSection className="space-y-4">
            {integrationEntry?.id &&
              !integrationEntry?.parent_id &&
              !integrationEntry?.approved && (
                <Alert_Shadcn_ className="w-full mb-0" variant="warning">
                  <WarningIcon />
                  <div>
                    <AlertTitle_Shadcn_ className="text-sm">Awaiting Approval</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="text-xs">
                      Your entry awaits approval by Supabase team. In the meantime, you can see the
                      preview{' '}
                      <a
                        className="cursor-pointer"
                        href={`https://supabase.com/integrations/${integrationEntry?.slug}?preview_token=${integrationEntry?.preview_token}`}
                        target="_blank"
                      >
                        here
                      </a>
                      .
                    </AlertDescription_Shadcn_>
                  </div>
                </Alert_Shadcn_>
              )}

            {integrationEntry?.parent_id && (
              <Alert_Shadcn_ className="w-full mb-0" variant="warning">
                <WarningIcon />
                <div>
                  <AlertTitle_Shadcn_ className="text-sm">Draft View</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="text-xs">
                    Your entry updates await approval by Supabase team. In the meantime, you can see
                    the preview{' '}
                    <a
                      className="cursor-pointer"
                      href={`https://supabase.com/integrations/${integrationEntry?.slug}?preview_token=${integrationEntry?.preview_token}`}
                      target="_blank"
                    >
                      here
                    </a>
                    .
                  </AlertDescription_Shadcn_>
                </div>
              </Alert_Shadcn_>
            )}

            <div className="flex flex-row space-x-6">
              <div className="w-3/4 space-y-6">
                <FormField_Shadcn_
                  key="slug"
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Slug"
                      description="The unique identifier for this integration (will be used in the URL)"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} autoFocus />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                <FormField_Shadcn_
                  key="title"
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItemLayout
                      label="Title"
                      description="A title of this integration (will be used in the search)"
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </div>
              <div className="w-1/4 flex items-center justify-center">
                <FormField_Shadcn_
                  key="logo"
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItemLayout
                      style={{
                        display: 'flex',
                        justifyItems: 'center',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <FormControl_Shadcn_>
                        <LogoFileInput logoUrl={field.value} onChange={field.onChange} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </div>
            </div>

            <FormField_Shadcn_
              key="developer"
              control={form.control}
              name="developer"
              render={({ field }) => (
                <FormItemLayout
                  label="Developer"
                  description="A name of the company/developer for this integration"
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              key="category"
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItemLayout label="Category">
                  <FormControl_Shadcn_>
                    <Select_Shadcn_
                      value={field.value}
                      onValueChange={(value) =>
                        form.setValue('category', value as keyof typeof IntegrationCategory)
                      }
                    >
                      <SelectTrigger_Shadcn_>
                        <SelectValue_Shadcn_ placeholder="Pick a category" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {Object.entries(IntegrationCategory).map(([key, value]) => (
                          <SelectItem_Shadcn_ key={key} value={key}>
                            {value}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              key="website"
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItemLayout label="Website" description="A link to your website">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              key="docs"
              control={form.control}
              name="docs"
              render={({ field }) => (
                <FormItemLayout label="Docs" description="A link to docs for this integration">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              key="video"
              control={form.control}
              name="video"
              render={({ field }) => (
                <FormItemLayout
                  label="Video"
                  description="A YouTube ID for the introduction video for this integration"
                  labelOptional="Optional"
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              key="description"
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItemLayout
                  label="Description"
                  description="Short description for your integration tha will be shown on the directory page."
                >
                  <FormControl_Shadcn_>
                    <ExpandingTextArea {...field} className="min-h-24" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              key="overview"
              control={form.control}
              name="overview"
              render={({ field }) => (
                <FormItemLayout label="Overview" description="">
                  <FormControl_Shadcn_>
                    <Tabs_Shadcn_ defaultValue="write" className="w-full">
                      <TabsList_Shadcn_ className="grid w-full grid-cols-2">
                        <TabsTrigger_Shadcn_ value="write">Write</TabsTrigger_Shadcn_>
                        <TabsTrigger_Shadcn_ value="preview">Preview</TabsTrigger_Shadcn_>
                      </TabsList_Shadcn_>
                      <TabsContent_Shadcn_ value="write" className="">
                        <DroppableTextArea
                          value={field.value}
                          onChange={field.onChange}
                          className="min-h-[400px]"
                        />
                      </TabsContent_Shadcn_>
                      <TabsContent_Shadcn_ value="preview">
                        <Markdown content={field.value} />
                      </TabsContent_Shadcn_>
                    </Tabs_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
        </form>
      </Form_Shadcn_>
      <SheetFooter>
        {!isCreating && integrationEntry?.id && (
          <div className="flex-1 flex flex-row gap-2">
            {integrationEntry.approved === false && (
              <Button
                type="danger"
                onClick={() => setShowDeleteDraftDialog(true)}
                loading={isLoading}
              >
                Discard Draft
              </Button>
            )}
          </div>
        )}

        <Button type="default" onClick={() => onClosing(false)} loading={isLoading}>
          Cancel
        </Button>
        <Button form={FORM_ID} htmlType="submit" loading={isLoading}>
          {!integrationEntry?.id ? 'Create' : 'Update'}
        </Button>
      </SheetFooter>

      <ConfirmationModal
        visible={showDeleteDraftDialog}
        title="Discard changes"
        confirmLabel="Discard"
        loading={isDeleting}
        onCancel={() => setShowDeleteDraftDialog(false)}
        onConfirm={() => {
          deleteIntegrationEntry({ orgSlug: organization!.slug, entryId: integrationEntry?.id! })
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to discard the draft changes? This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
