import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SidePanel,
  cn,
} from 'ui'
import * as z from 'zod'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEnumeratedTypeCreateMutation } from 'data/enumerated-types/enumerated-type-create-mutation'
import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'
import { NATIVE_POSTGRES_TYPES } from './EnumeratedTypes.constants'
import { AlertCircle, ExternalLink, Plus } from 'lucide-react'

interface CreateEnumeratedTypeSidePanelProps {
  visible: boolean
  onClose: () => void
  schema: string
}

const CreateEnumeratedTypeSidePanel = ({
  visible,
  onClose,
  schema,
}: CreateEnumeratedTypeSidePanelProps) => {
  const initialValues = { name: '', description: '', values: [{ value: '' }] }
  const submitRef = useRef<HTMLButtonElement>(null)
  const { project } = useProjectContext()
  const { mutate: createEnumeratedType, isLoading: isCreating } = useEnumeratedTypeCreateMutation({
    onSuccess: (res, vars) => {
      toast.success(`Successfully created type "${vars.name}"`)
      closePanel()
    },
  })

  useEffect(() => {
    form.reset(initialValues)
  }, [visible])

  const FormSchema = z.object({
    name: z
      .string()
      .min(1, 'Please provide a name for your enumerated type')
      .refine((value) => !NATIVE_POSTGRES_TYPES.includes(value), {
        message: 'Name cannot be a native Postgres data type',
      })
      .default(''),
    description: z.string().default('').optional(),
    values: z
      .object({ value: z.string().min(1, 'Please provide a value') })
      .array()
      .default([]),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })

  const { fields, append, remove, move } = useFieldArray({
    name: 'values',
    control: form.control,
  })

  const updateOrder = (result: any) => {
    // Dropped outside of the list
    if (!result.destination) return
    move(result.source.index, result.destination.index)
  }

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (project?.ref === undefined) return console.error('Project ref required')
    if (project?.connectionString === undefined)
      return console.error('Project connectionString required')

    createEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      schema,
      name: data.name,
      description: data.description?.replaceAll("'", "''"),
      values: data.values.filter((x) => x.value.length > 0).map((x) => x.value.trim()),
    })
  }

  const closePanel = () => {
    form.reset(initialValues)
    onClose()
  }

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={closePanel}
      header="Create a new enumerated type"
      confirmText="Create type"
      onConfirm={() => {
        if (submitRef.current) submitRef.current.click()
      }}
    >
      <SidePanel.Content className="py-4">
        <Form_Shadcn_ {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem_Shadcn_>
                  <FormLabel_Shadcn_>Description</FormLabel_Shadcn_>
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} />
                  </FormControl_Shadcn_>
                  <FormDescription_Shadcn_>Optional</FormDescription_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />

            <DragDropContext onDragEnd={(result: any) => updateOrder(result)}>
              <Droppable droppableId="enum_type_values_droppable">
                {(droppableProvided: DroppableProvided) => (
                  <div ref={droppableProvided.innerRef}>
                    {fields.map((field, index) => (
                      <FormField_Shadcn_
                        control={form.control}
                        key={field.id}
                        name={`values.${index}.value`}
                        render={({ field: inputField }) => (
                          <FormItem_Shadcn_>
                            <FormLabel_Shadcn_ className={cn(index !== 0 && 'sr-only')}>
                              Values
                            </FormLabel_Shadcn_>
                            {index === 0 && (
                              <Alert_Shadcn_>
                                <AlertCircle strokeWidth={1.5} />
                                <AlertTitle_Shadcn_>
                                  After creation, values cannot be deleted or sorted
                                </AlertTitle_Shadcn_>
                                <AlertDescription_Shadcn_>
                                  <p className="!leading-normal track">
                                    You will need to delete and recreate the enumerated type with
                                    the updated values instead.
                                  </p>
                                  <Button
                                    asChild
                                    type="default"
                                    icon={<ExternalLink strokeWidth={1.5} />}
                                    className="mt-2"
                                  >
                                    <Link
                                      href="https://www.postgresql.org/message-id/21012.1459434338%40sss.pgh.pa.us"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Learn more
                                    </Link>
                                  </Button>
                                </AlertDescription_Shadcn_>
                              </Alert_Shadcn_>
                            )}
                            <FormControl_Shadcn_>
                              <EnumeratedTypeValueRow
                                index={index}
                                id={field.id}
                                field={inputField}
                                isDisabled={fields.length < 2}
                                onRemoveValue={() => remove(index)}
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ className="ml-6" />
                          </FormItem_Shadcn_>
                        )}
                      />
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Button
              type="default"
              icon={<Plus strokeWidth={1.5} />}
              onClick={() => append({ value: '' })}
            >
              Add value
            </Button>

            <Button ref={submitRef} htmlType="submit" type="default" className="hidden">
              Update
            </Button>
          </form>
        </Form_Shadcn_>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default CreateEnumeratedTypeSidePanel
