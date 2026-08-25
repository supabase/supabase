import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelector } from 'ui-patterns/multi-select'
import { z } from 'zod'

import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useCreatePublicationMutation } from '@/data/replication/publication-create-mutation'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import { useReplicationTablesQuery } from '@/data/replication/tables-query'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'

interface NewPublicationPanelProps {
  visible: boolean
  onClose: (newPublication?: string) => void
}

const FORM_ID = 'publication-editor'

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tableIds: z.array(z.string()).min(1, 'At least one table is required'),
})
type FormValues = z.infer<typeof FormSchema>

const defaultValues: FormValues = {
  name: '',
  tableIds: [],
}

export const NewPublicationPanel = ({ visible, onClose }: NewPublicationPanelProps) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })

  const { data: tables } = useReplicationTablesQuery({ projectRef, sourceId }, { enabled: visible })

  const form = useForm<FormValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  // Always destructure formState values otherwise they won't be updated
  // See https://react-hook-form.com/docs/useform/formstate
  const { isDirty } = form.formState

  const closePanel = (newPublication?: string) => {
    form.reset(defaultValues)
    onClose(newPublication)
  }

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: () => closePanel(),
  })

  const { mutate: createPublication, isPending: creatingPublication } =
    useCreatePublicationMutation({
      onSuccess: (_, vars) => {
        toast.success('Successfully created publication')
        closePanel(vars.name)
      },
    })

  const onSubmit = async (data: FormValues) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return console.error('Source id is required')

    createPublication({
      projectRef,
      sourceId,
      name: data.name,
      tableIds: data.tableIds.map(Number),
    })
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={handleOpenChange}>
        <SheetContent size="default">
          <div className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>Create a new publication</SheetTitle>
              <SheetDescription>Choose which tables to replicate to destinations.</SheetDescription>
            </SheetHeader>
            <SheetSection className="grow overflow-auto">
              <Form {...form}>
                <form
                  id={FORM_ID}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout label="Name" layout="horizontal">
                        <FormControl>
                          <Input {...field} placeholder="Name" />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tableIds"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Tables"
                        layout="horizontal"
                        description="Select at least one table to include in the publication."
                      >
                        <FormControl>
                          <MultiSelector
                            values={field.value}
                            onValuesChange={field.onChange}
                            disabled={creatingPublication}
                          >
                            <MultiSelector.Trigger
                              badgeLimit="wrap"
                              label="Select tables..."
                              mode="inline-combobox"
                            />
                            <MultiSelector.Content>
                              <MultiSelector.List>
                                {tables?.map((table) => (
                                  <MultiSelector.Item key={table.id} value={String(table.id)}>
                                    {`${table.schema}.${table.name}`}
                                  </MultiSelector.Item>
                                ))}
                              </MultiSelector.List>
                            </MultiSelector.Content>
                          </MultiSelector>
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </form>
              </Form>
            </SheetSection>
            <SheetFooter>
              <Button variant="default" disabled={creatingPublication} onClick={confirmOnClose}>
                Cancel
              </Button>
              <Button variant="primary" loading={creatingPublication} form={FORM_ID} type="submit">
                Create publication
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
