import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useIcebergNamespaceCreateMutation } from 'data/storage/iceberg-namespace-create-mutation'
import {
  NamespaceTableFields,
  useIcebergNamespaceTableCreateMutation,
} from 'data/storage/iceberg-namespace-table-create-mutation'
import { useIcebergNamespaceTablesQuery } from 'data/storage/iceberg-namespace-tables-query'
import { useIcebergNamespacesQuery } from 'data/storage/iceberg-namespaces-query'
import { Plus, X } from 'lucide-react'
import { Fragment, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  DialogSectionSeparator,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { COLUMN_TYPE_FIELDS, COLUMN_TYPES } from './CreateTableSheet.constants'
import { createFormSchema } from './CreateTableSheet.schema'

const formId = 'create-namespace-table'
const NEW_NAMESPACE_MARKER = 'new-namespace'

interface CreateTableSheetProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

export const CreateTableSheet = ({ open, onOpenChange }: CreateTableSheetProps) => {
  const { ref: projectRef, bucketId } = useParams()
  const [isCreating, setIsCreating] = useState(false)

  const FormSchema = createFormSchema()
  const defaultValues = {
    namespace: '',
    newNamespace: undefined,
    name: '',
    columns: [{ name: '', type: 'string' as any }],
  }
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: 'onChange',
  })
  const { namespace } = form.watch()
  const {
    fields: columns,
    append: appendColumn,
    remove: removeColumn,
  } = useFieldArray({ control: form.control, name: 'columns' })

  const { data: namespaces = [] } = useIcebergNamespacesQuery({ projectRef, warehouse: bucketId })
  const { data: tables = [] } = useIcebergNamespaceTablesQuery(
    {
      projectRef,
      warehouse: bucketId,
      namespace,
    },
    { enabled: namespace !== NEW_NAMESPACE_MARKER }
  )

  const { mutateAsync: createNamespace } = useIcebergNamespaceCreateMutation()
  const { mutateAsync: createTable } = useIcebergNamespaceTableCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!bucketId) return console.error('Bucket ID is missing')
    if (namespaces.includes(values.newNamespace ?? '')) {
      return form.setError('newNamespace', { message: 'Namespace name already exists' })
    }
    if (tables.includes(values.name ?? '')) {
      return form.setError('name', { message: 'Table name already exists' })
    }

    const isCreatingNewNamespace =
      values.namespace === NEW_NAMESPACE_MARKER && !!values.newNamespace

    try {
      setIsCreating(true)
      if (isCreatingNewNamespace) {
        await createNamespace({
          projectRef,
          warehouse: bucketId,
          namespace: values.newNamespace as string,
        })
      }

      const fields = values.columns.map((column, idx) => {
        return {
          id: idx + 1,
          name: column.name,
          type:
            column.type === 'decimal'
              ? `decimal(${column.precision}, ${column.scale})`
              : column.type === 'fixed'
                ? `fixed[${column.length}]`
                : column.type,
          required: false,
        }
      }) as NamespaceTableFields

      await createTable({
        projectRef,
        warehouse: bucketId,
        namespace: isCreatingNewNamespace ? (values.newNamespace as string) : values.namespace,
        name: values.name,
        fields,
      })

      toast.success(`Successfully created table in ${values.newNamespace ?? values.namespace}!`)
      onOpenChange(false)
      form.reset(defaultValues)
    } catch (error) {
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Form_Shadcn_ {...form}>
        <form id={formId} className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <SheetContent aria-describedby={undefined} className="flex flex-col gap-0">
            <SheetHeader className="shrink-0 flex items-center gap-4">
              <SheetTitle>Create a new table</SheetTitle>
            </SheetHeader>

            <SheetSection className="overflow-auto flex-grow p-0">
              <div className="flex flex-col gap-y-4 py-4 px-5">
                <FormField_Shadcn_
                  name="namespace"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      name="namespace"
                      label="Select a namespace to create your table in"
                    >
                      <FormControl_Shadcn_>
                        <Select_Shadcn_
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            form.resetField('newNamespace')
                          }}
                        >
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select a namespace" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {namespaces.map((x) => (
                              <SelectItem_Shadcn_ key={x} value={x}>
                                {x}
                              </SelectItem_Shadcn_>
                            ))}
                            {namespaces.length > 0 && <SelectSeparator_Shadcn_ />}
                            <SelectItem_Shadcn_ value={NEW_NAMESPACE_MARKER}>
                              <div className="flex items-center gap-x-2">
                                <Plus size={14} />
                                <p>Create a new namespace</p>
                              </div>
                            </SelectItem_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
                {namespace === NEW_NAMESPACE_MARKER && (
                  <FormField_Shadcn_
                    name="newNamespace"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="newNamespace" label="Name of new namespace">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            placeholder="Provide a name for your new namespace"
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                )}
              </div>

              <DialogSectionSeparator />

              {!!namespace && (
                <div className="px-5 py-4 flex flex-col gap-y-4">
                  <FormField_Shadcn_
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout name="name" label="Name of table">
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            placeholder="Provide a name for your new table"
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">Columns</p>
                      <Button
                        type="default"
                        icon={<Plus />}
                        onClick={() => appendColumn({ name: '', type: 'string' })}
                      >
                        Add column
                      </Button>
                    </div>
                    {columns.length === 0 ? (
                      <div className="flex items-center justify-center rounded border border-strong border-dashed py-4 text-foreground-lighter text-sm">
                        Add a column to your table
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-[1fr,1fr,32px]">
                          <p className="text-xs text-foreground-lighter">Name</p>
                          <p className="text-xs text-foreground-lighter">Type</p>
                        </div>
                        {columns.map((_, idx) => {
                          const columnType = form.watch(`columns.${idx}.type`)
                          const additionalFields =
                            COLUMN_TYPE_FIELDS[columnType as keyof typeof COLUMN_TYPE_FIELDS] ?? []

                          return (
                            <Fragment key={`column-${idx}`}>
                              <div className="grid grid-cols-[1fr,1fr,32px] gap-x-1">
                                <FormField_Shadcn_
                                  control={form.control}
                                  name={`columns.${idx}.name`}
                                  render={({ field }) => (
                                    <FormControl_Shadcn_>
                                      <Input_Shadcn_
                                        {...field}
                                        placeholder="Provide a column name"
                                        disabled={isCreating}
                                        className="h-auto"
                                      />
                                    </FormControl_Shadcn_>
                                  )}
                                />
                                <FormField_Shadcn_
                                  control={form.control}
                                  name={`columns.${idx}.type`}
                                  render={({ field }) => (
                                    <FormControl_Shadcn_>
                                      <Select_Shadcn_
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <SelectTrigger_Shadcn_ className="h-auto">
                                          <SelectValue_Shadcn_ placeholder="Select a type" />
                                        </SelectTrigger_Shadcn_>
                                        <SelectContent_Shadcn_>
                                          {COLUMN_TYPES.map((x) => (
                                            <SelectItem_Shadcn_ key={x} value={x}>
                                              {x}
                                            </SelectItem_Shadcn_>
                                          ))}
                                        </SelectContent_Shadcn_>
                                      </Select_Shadcn_>
                                    </FormControl_Shadcn_>
                                  )}
                                />
                                <div className="flex items-center justify-center">
                                  <Button
                                    type="text"
                                    size="tiny"
                                    icon={<X strokeWidth={1.5} size={14} />}
                                    className="w-6 h-6"
                                    onClick={() => removeColumn(idx)}
                                  />
                                </div>

                                {additionalFields.length > 0 && (
                                  <div className="col-span-full flex items-center mt-2">
                                    <div className="grid grid-cols-2 gap-x-1 w-[85%]">
                                      {additionalFields.map((x, index) => (
                                        <div
                                          key={x.name}
                                          className="flex items-center"
                                          style={
                                            additionalFields.length % 2 === 1 && index % 2 === 0
                                              ? { gridColumnStart: 2 }
                                              : undefined
                                          }
                                        >
                                          <div className="font-mono text-xs px-2 border border-r-0 rounded-l h-full flex items-center justify-center">
                                            {x.name}
                                          </div>
                                          <FormField_Shadcn_
                                            control={form.control}
                                            key={`columns.${idx}.${x.name}`}
                                            name={`columns.${idx}.${x.name}` as any}
                                            render={({ field }) => (
                                              <FormControl_Shadcn_>
                                                <Input_Shadcn_
                                                  {...field}
                                                  type={x.type === 'number' ? 'number' : 'text'}
                                                  disabled={isCreating}
                                                  className="h-[34px] rounded-l-none"
                                                  {...form.register(
                                                    `columns.${idx}.${x.name}` as any,
                                                    {
                                                      valueAsNumber: true, // Ensure the value is handled as a number
                                                    }
                                                  )}
                                                />
                                              </FormControl_Shadcn_>
                                            )}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="w-4 h-[1.6rem] border-r border-b rounded-br mr-3 border-control -translate-y-3" />
                                  </div>
                                )}
                              </div>
                            </Fragment>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}
            </SheetSection>

            <SheetFooter>
              <Button
                disabled={isCreating}
                type="default"
                onClick={() => {
                  onOpenChange(false)
                  form.reset(defaultValues)
                }}
              >
                Cancel
              </Button>
              <Button form={formId} htmlType="submit" loading={isCreating}>
                Create table
              </Button>
            </SheetFooter>
          </SheetContent>
        </form>
      </Form_Shadcn_>
    </Sheet>
  )
}
