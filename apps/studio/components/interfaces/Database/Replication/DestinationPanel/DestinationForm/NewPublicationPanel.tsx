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

import { useCreatePublicationMutation } from '@/data/replication/publication-create-mutation'
import { useReplicationTablesQuery } from '@/data/replication/tables-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface NewPublicationPanelProps {
  visible: boolean
  sourceId?: number
  onClose: (newPublication?: string) => void
}

export const NewPublicationPanel = ({ visible, sourceId, onClose }: NewPublicationPanelProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: tables } = useReplicationTablesQuery({ projectRef, sourceId })

  const { mutate: createPublication, isPending: creatingPublication } =
    useCreatePublicationMutation({
      onSuccess: (_, vars) => {
        toast.success('Successfully created publication')
        form.reset(defaultValues)
        onClose(vars.name)
      },
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
    if (!project) return console.error('Project is required')
    if (!sourceId) return console.error('Source id is required')

    const tables = data.tables.map((table) => {
      const [schema, name] = table.split('.')
      return { schema, name }
    })

    createPublication({
      projectRef,
      sourceId,
      name: data.name,
      tables,
      connectionString: project.connectionString,
    })
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={() => onClose()}>
        <SheetContent size="default">
          <div className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>Create a new publication</SheetTitle>
              <SheetDescription>Choose which tables to replicate to destinations.</SheetDescription>
            </SheetHeader>
            <SheetSection className="grow overflow-auto">
              <Form {...form}>
                <form
                  id={formId}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout label="Name" layout="vertical">
                        <FormControl>
                          <Input {...field} placeholder="Name" />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tables"
                    render={({ field }) => (
                      <FormItemLayout
                        label="Tables"
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
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </form>
              </Form>
            </SheetSection>
            <SheetFooter>
              <Button variant="default" disabled={creatingPublication} onClick={() => onClose()}>
                Cancel
              </Button>
              <Button variant="primary" disabled={creatingPublication} form={formId} type="submit">
                Create publication
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
