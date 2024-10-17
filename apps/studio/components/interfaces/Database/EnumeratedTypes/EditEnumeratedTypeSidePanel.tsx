import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
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
import { useEnumeratedTypeUpdateMutation } from 'data/enumerated-types/enumerated-type-update-mutation'
import type { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
import { DragDropContext, Droppable, DroppableProvided } from 'react-beautiful-dnd'
import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'
import { AlertCircle, ExternalLink, Plus } from 'lucide-react'

interface EditEnumeratedTypeSidePanelProps {
  visible: boolean
  selectedEnumeratedType?: EnumeratedType
  onClose: () => void
}

const EditEnumeratedTypeSidePanel = ({
  visible,
  selectedEnumeratedType,
  onClose,
}: EditEnumeratedTypeSidePanelProps) => {
  const submitRef = useRef<HTMLButtonElement>(null)
  const { project } = useProjectContext()
  const { mutate: updateEnumeratedType, isLoading: isCreating } = useEnumeratedTypeUpdateMutation({
    onSuccess: (_, vars) => {
      toast.success(`Successfully updated type "${vars.name.updated}"`)
      onClose()
    },
  })

  const FormSchema = z.object({
    name: z.string().min(1, 'Please provide a name for your enumerated type').default(''),
    description: z.string().default('').optional(),
    values: z
      .object({
        isNew: z.boolean(),
        originalValue: z.string(),
        updatedValue: z.string().min(1, 'Please provide a value'),
      })
      .array()
      .default([]),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      description: '',
      values: [{ isNew: true, originalValue: '', updatedValue: '' }],
    },
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

  const originalEnumeratedTypes = (selectedEnumeratedType?.enums ?? []).map((x) => ({
    isNew: false,
    originalValue: x,
    updatedValue: x,
  }))

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (project?.ref === undefined) return console.error('Project ref required')
    if (project?.connectionString === undefined)
      return console.error('Project connectionString required')
    if (selectedEnumeratedType === undefined)
      return console.error('selectedEnumeratedType required')

    const payload: {
      schema: string
      name: { original: string; updated: string }
      values: { original: string; updated: string; isNew: boolean }[]
      description?: string
    } = {
      schema: selectedEnumeratedType.schema,
      name: { original: selectedEnumeratedType.name, updated: data.name },
      values: data.values
        .filter((x) => x.updatedValue.length !== 0)
        .map((x) => ({
          original: x.originalValue,
          updated: x.updatedValue.trim(),
          isNew: x.isNew,
        })),
      ...(data.description !== selectedEnumeratedType.comment
        ? { description: data.description?.replaceAll("'", "''") }
        : {}),
    }

    updateEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      ...payload,
    })
  }

  useEffect(() => {
    if (selectedEnumeratedType !== undefined) {
      form.reset({
        name: selectedEnumeratedType.name,
        description: selectedEnumeratedType.comment ?? '',
        values: originalEnumeratedTypes,
      })
    }

    if (selectedEnumeratedType == undefined) {
      form.reset({
        values: originalEnumeratedTypes,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnumeratedType])

  return (
    <SidePanel
      loading={isCreating}
      visible={visible}
      onCancel={onClose}
      header={`Update type "${selectedEnumeratedType?.name}"`}
      confirmText="Update type"
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
                        name={`values.${index}.updatedValue`}
                        render={({ field: inputField }) => (
                          <FormItem_Shadcn_>
                            <FormLabel_Shadcn_ className={cn(index !== 0 && 'sr-only')}>
                              Values
                            </FormLabel_Shadcn_>
                            {index === 0 && (
                              <Alert_Shadcn_>
                                <AlertCircle strokeWidth={1.5} />
                                <AlertTitle_Shadcn_>
                                  Existing values cannot be deleted or sorted
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
                                isDisabled={!field.isNew}
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
              onClick={() => append({ isNew: true, originalValue: '', updatedValue: '' })}
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

export default EditEnumeratedTypeSidePanel
