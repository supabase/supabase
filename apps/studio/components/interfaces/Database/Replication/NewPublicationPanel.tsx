import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useCreatePublicationMutation } from 'data/replication/create-publication-mutation'
import { useReplicationTablesQuery } from 'data/replication/tables-query'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  cn,
  Button,
  SheetFooter,
  SheetSection,
  Form_Shadcn_,
  FormLabel_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormControl_Shadcn_,
  Input_Shadcn_,
  FormMessage_Shadcn_,
} from 'ui'
import { MultiSelector } from 'ui-patterns/multi-select'
import { z } from 'zod'

interface NewPublicationPanelProps {
  visible: boolean
  sourceId?: number
  onClose: () => void
}

const NewPublicationPanel = ({ visible, sourceId, onClose }: NewPublicationPanelProps) => {
  const { ref: projectRef } = useParams()
  const { mutateAsync: createPublication, isLoading: creatingPublication } =
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
        <SheetContent showClose={false} size="default">
          <div className="flex flex-col h-full">
            <SheetHeader>
              <div className="flex flex-row justify-between items-center">
                <SheetTitle>New Publication</SheetTitle>
                <SheetClose
                  className={cn(
                    'text-muted hover:opacity-100',
                    'focus:outline-none focus:ring-2',
                    'disabled:pointer-events-none'
                  )}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </div>
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
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} placeholder="Name" />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  <FormField_Shadcn_
                    control={form.control}
                    name="tables"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Tables</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <MultiSelector
                            values={field.value}
                            onValuesChange={field.onChange}
                            disabled={creatingPublication}
                          >
                            <MultiSelector.Trigger>
                              <MultiSelector.Input placeholder="Select tables" />
                            </MultiSelector.Trigger>
                            <MultiSelector.Content>
                              <MultiSelector.List>
                                {tables?.tables.map((table) => (
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
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
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

export default NewPublicationPanel
