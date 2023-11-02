import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
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
  IconAlertCircle,
  IconExternalLink,
  IconPlus,
  Input_Shadcn_,
  SidePanel,
  cn,
} from 'ui'
import * as z from 'zod'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useEnumeratedTypeCreateMutation } from 'data/enumerated-types/enumerated-type-create-mutation'
import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'

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
  const submitRef = useRef<HTMLButtonElement>(null)
  const { project } = useProjectContext()
  const { mutate: createEnumeratedType, isLoading: isCreating } = useEnumeratedTypeCreateMutation({
    onSuccess: (res, vars) => {
      toast.success(`Successfully created type "${vars.name}"`)
      onClose()
    },
  })

  const FormSchema = z.object({
    name: z.string().min(1, 'Please provide a name for your enumerated type').default(''),
    description: z.string().default('').optional(),
    values: z
      .object({ value: z.string().min(1, 'Please provide a value') })
      .array()
      .default([]),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', description: '', values: [{ value: '' }] },
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
      values: data.values.filter((x) => x.value.length > 0).map((x) => x.value),
    })
  }

  useEffect(() => {
    if (visible) form.reset()
  }, [visible])

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={onClose}
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
                                <IconAlertCircle strokeWidth={1.5} />
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
                                    icon={<IconExternalLink strokeWidth={1.5} />}
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
              icon={<IconPlus strokeWidth={1.5} />}
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
