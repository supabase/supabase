import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import z from 'zod'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useIntegrationDirectoryEntryCreateMutation } from 'data/integrations-directory/integration-directory-entry-create-mutation'
import { useIntegrationDirectoryEntryDeleteMutation } from 'data/integrations-directory/integration-directory-entry-delete-mutation'
import { useIntegrationDirectoryEntryUpdateMutation } from 'data/integrations-directory/integration-directory-entry-update-mutation'
import { IntegrationEntry } from 'data/integrations-directory/integrations-directory-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import type { FormSchema } from 'types'
import {
  Button,
  ExpandingTextArea,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
  SheetClose,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FORM_ID = 'create-function-sidepanel'

interface CreateIntegrationSheetProps {
  integrationEntry?: IntegrationEntry
  setVisible: (value: boolean) => void
}

const FormSchema = z.object({
  enabled: z.boolean(),
  slug: z.string(),
  overview: z.string(),
})

export const CreateIntegrationSheet = ({
  integrationEntry,
  setVisible,
}: CreateIntegrationSheetProps) => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  const isEditing = !!integrationEntry?.id

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      enabled: true,
    },
  })

  const { mutate: createIntegrationEntry, isLoading: isCreating } =
    useIntegrationDirectoryEntryCreateMutation()
  const { mutate: updateIntegrationEntry, isLoading: isUpdating } =
    useIntegrationDirectoryEntryUpdateMutation()
  const { mutate: deleteIntegrationEntry, isLoading: isDeleting } =
    useIntegrationDirectoryEntryDeleteMutation()

  const onDelete = () => {
    deleteIntegrationEntry({ entryId: '' })
  }

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (isEditing) {
      updateIntegrationEntry(
        {
          entryId: integrationEntry!.id,
          params: {
            organization_id: organization!.id,
            slug: data.slug,
            overview: data.overview,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Successfully updated integration`)
            setVisible(false)
          },
        }
      )
    } else {
      createIntegrationEntry(
        {
          params: {
            organization_id: organization!.id,
            slug: data.slug,
            overview: data.overview,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Successfully added an integration entry ${data.slug}`)
            setVisible(false)
          },
        }
      )
    }
  }

  const isLoading = isCreating || isUpdating || isDeleting

  const integrationSlug = form.watch('slug')

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
            {isCreating ? `Add integration` : `Update ${integrationSlug}`}
          </SheetTitle>
        </div>
      </SheetHeader>
      <Separator />
      <Form_Shadcn_ {...form}>
        <form id={FORM_ID} className="w-full flex-1" onSubmit={form.handleSubmit(onSubmit)}>
          <SheetSection>
            <FormField_Shadcn_
              key="enabled"
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItemLayout label={`Enable integration`} layout="flex">
                  <FormControl_Shadcn_>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={field.disabled}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
          <Separator />
          <SheetSection className="space-y-4">
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
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              key="overview"
              control={form.control}
              name="overview"
              render={({ field }) => (
                <FormItemLayout
                  label="Overview"
                  description="Description for your integration. Will be shown on your page."
                >
                  <FormControl_Shadcn_>
                    <ExpandingTextArea {...field} className="min-h-24" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </SheetSection>
        </form>
      </Form_Shadcn_>
      <SheetFooter>
        {!isCreating && (
          <div className="flex-1">
            <Button type="danger" onClick={() => onDelete()} loading={isLoading}>
              Delete hook
            </Button>
          </div>
        )}

        <Button type="default" onClick={() => setVisible(false)} loading={isLoading}>
          Cancel
        </Button>
        <Button form={FORM_ID} htmlType="submit" loading={isLoading}>
          {isCreating ? 'Create' : 'Update'}
        </Button>
      </SheetFooter>
    </>
  )
}
