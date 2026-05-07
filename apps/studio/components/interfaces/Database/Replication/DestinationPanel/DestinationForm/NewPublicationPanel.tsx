import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import { useCreatePublicationMutation } from 'data/replication/publication-create-mutation'
import { useReplicationTablesQuery } from 'data/replication/tables-query'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
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

interface NewPublicationPanelProps {
  visible: boolean
  sourceId?: number
  onClose: () => void
}

export const NewPublicationPanel = ({ visible, sourceId, onClose }: NewPublicationPanelProps) => {
  const { ref: projectRef } = useParams()
  const { mutateAsync: createPublication, isPending: creatingPublication } =
    useCreatePublicationMutation()
  const { data: tables } = useReplicationTablesQuery({
    projectRef,
    sourceId,
  })
  const formId = 'publication-editor'
  const FormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    tables: z.array(z.string()).min(1, 'At least one table is required'),
  })
  const defaultValues = {
    name: '',
    tables: [],
  }
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return console.error('Source id is required')
    try {
      await createPublication({
        projectRef,
        sourceId,
        name: data.name,
        tables: data.tables.map((table) => {
          const [schema, name] = table.split('.')
          return { schema, name }
        }),
      })
      toast.success('Successfully created publication')
      onClose()
    } catch (error) {
      toast.error('Failed to create publication')
    }
    form.reset(defaultValues)
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent size="default">
          <div className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>Create a new Publication</SheetTitle>
              <SheetDescription>Replicate table changes to destinations</SheetDescription>
            </SheetHeader>
            <SheetSection className="flex-grow overflow-auto">
              <Form_Shadcn_ {...form}>
                <form
                  id={formId}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-y-4"
                >
                  <FormField_Shadcn_
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout label="Name" layout="vertical">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} placeholder="Name" />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                  <FormField_Shadcn_
                    control={form.control}
                    name="tables"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Tables"
                        description="Which tables to replicate to destinations"
                      >
                        <FormControl_Shadcn_>
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
                                  <MultiSelector.Item
                                    key={`${table.schema}.${table.name}`}
                                    value={`${table.schema}.${table.name}`}
                                  >
                                    {`${table.schema}.${table.name}`}
                                  </MultiSelector.Item>
                                ))}
                              </MultiSelector.List>
                            </MultiSelector.Content>
                          </MultiSelector>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </form>
              </Form_Shadcn_>
            </SheetSection>
            <SheetFooter>
              <Button type="default" disabled={creatingPublication} onClick={onClose}>
                Cancel
              </Button>
              <Button type="primary" disabled={creatingPublication} form={formId} htmlType="submit">
                Create publication
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
