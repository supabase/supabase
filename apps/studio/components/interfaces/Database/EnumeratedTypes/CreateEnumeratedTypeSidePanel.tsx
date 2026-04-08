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
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  SidePanel,
} from 'ui'
import * as z from 'zod'

import { NATIVE_POSTGRES_TYPES } from './EnumeratedTypes.constants'
import EnumeratedTypeValueRow from './EnumeratedTypeValueRow'
import { useEnumeratedTypeCreateMutation } from '@/data/enumerated-types/enumerated-type-create-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface CreateEnumeratedTypeSidePanelProps {
  visible: boolean
  onClose: () => void
  schema: string
}

const initialValues = { name: '', description: '', values: [{ value: '' }] }

const CreateEnumeratedTypeSidePanel = ({
  visible,
  onClose,
  schema,
}: CreateEnumeratedTypeSidePanelProps) => {
  const submitRef = useRef<HTMLButtonElement>(null)
  const { data: project } = useSelectedProjectQuery()
  const { mutate: createEnumeratedType, isPending: isCreating } = useEnumeratedTypeCreateMutation({
    onSuccess: (res, vars) => {
      toast.success(`Successfully created type "${vars.name}"`)
      closePanel()
    },
  })

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
  const { reset } = form
  const { isDirty } = form.formState

  useEffect(() => {
    reset(initialValues)
  }, [reset, visible])

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
                <AlertTitle_Shadcn_>
                  After creation, values cannot be deleted or sorted
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <p className="!leading-normal track">
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
                      name={`values.${index}.value`}
                      index={index}
                      control={form.control}
                      isDisabled={fields.length < 2}
                      onRemoveValue={() => remove(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

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
