import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  cn,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input_Shadcn_,
  SidePanel,
} from 'ui'
import * as z from 'zod'

import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'
import { useEnumeratedTypeUpdateMutation } from '@/data/enumerated-types/enumerated-type-update-mutation'
import type { EnumeratedType } from '@/data/enumerated-types/enumerated-types-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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
  const { data: project } = useSelectedProjectQuery()
  const { mutate: updateEnumeratedType, isPending: isCreating } = useEnumeratedTypeUpdateMutation({
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
      values: (selectedEnumeratedType?.enums ?? []).map((x) => ({
        isNew: false,
        originalValue: x,
        updatedValue: x,
      })),
    },
  })
  const { reset } = form
  const { isDirty } = form.formState
  const { fields, append, remove, move } = useFieldArray({
    name: 'values',
    control: form.control,
  })

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over == null) return
    const overIndex = fields.findIndex((item) => item.id === event.over?.id)
    if (overIndex < 0) return
    const activeIndex = fields.findIndex((item) => item.id === event.active.id)
    if (activeIndex < 0) return

    move(activeIndex, overIndex)
  }

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
        ? { description: data.description }
        : {}),
    }

    updateEnumeratedType({
      projectRef: project.ref,
      connectionString: project.connectionString,
      ...payload,
    })
  }

  useEffect(() => {
    const originalEnumeratedTypes = (selectedEnumeratedType?.enums ?? []).map((x) => ({
      isNew: false,
      originalValue: x,
      updatedValue: x,
    }))

    if (selectedEnumeratedType !== undefined) {
      reset({
        name: selectedEnumeratedType.name,
        description: selectedEnumeratedType.comment ?? '',
        values: originalEnumeratedTypes,
      })
    }

    if (selectedEnumeratedType == undefined) {
      reset({
        values: originalEnumeratedTypes,
      })
    }
  }, [reset, selectedEnumeratedType, visible])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return (
    <SidePanel
      loading={isCreating}
      disabled={!isDirty}
      visible={visible}
      onCancel={onClose}
      header={`Update type "${selectedEnumeratedType?.name}"`}
      confirmText="Update type"
      onConfirm={() => {
        if (submitRef.current) submitRef.current.click()
      }}
    >
      <SidePanel.Content className="py-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input_Shadcn_ {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input_Shadcn_ {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                </FormItem>
              )}
            />

            <div>
              <span
                className={cn(
                  'text-foreground-light text-sm',
                  'transition-colors',
                  'leading-normal'
                )}
              >
                Values
              </span>
              <Alert_Shadcn_>
                <AlertCircle strokeWidth={1.5} />
                <AlertTitle_Shadcn_>Existing values cannot be deleted or sorted</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <p className="leading-normal! track">
                    You will need to delete and recreate the enumerated type with the updated values
                    instead.
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                  {fields.map((field, index) => (
                    <EnumeratedTypeValueRow
                      key={field.id}
                      id={field.id}
                      name={`values.${index}.updatedValue`}
                      index={index}
                      control={form.control}
                      isDisabled={!field.isNew}
                      onRemoveValue={() => remove(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

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
        </Form>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default EditEnumeratedTypeSidePanel
