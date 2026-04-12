import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Edit, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  WarningIcon,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import InputField from './InputField'
import { WrapperMeta } from './Wrappers.types'
import { FormattedWrapperTable, getWrapperCreationFormSchema, NewTable } from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemaCreateMutation } from '@/data/database/schema-create-mutation'
import { invalidateSchemasQuery, useSchemasQuery } from '@/data/database/schemas-query'
import { useFDWCreateMutation } from '@/data/fdw/fdw-create-mutation'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const FORM_ID = 'create-wrapper-form'

export interface CreateWrapperSheetProps {
  wrapperMeta: WrapperMeta
  onDirty: (isDirty: boolean) => void
  onClose: () => void
  onCloseWithConfirmation: () => void
}

export const CreateWrapperSheet = ({
  wrapperMeta,
  onDirty,
  onClose,
  onCloseWithConfirmation,
}: CreateWrapperSheetProps) => {
  const queryClient = useQueryClient()

  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const [selectedTableToEdit, setSelectedTableToEdit] = useState<
    FormattedWrapperTable | undefined
  >()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappersExtension = extensions?.find((ext) => ext.name === 'wrappers')
  // The import foreign schema requires a minimum extension version of 0.5.0
  const hasRequiredVersionForeignSchema = wrappersExtension?.installed_version
    ? wrappersExtension?.installed_version >= '0.5.0'
    : false

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref!,
    connectionString: project?.connectionString,
  })

  const initialValues = {
    wrapper_name: '',
    server_name: '',
    mode: wrapperMeta.tables.length > 0 ? 'tables' : 'schema',
    source_schema: wrapperMeta.sourceSchemaOption?.defaultValue ?? '',
    target_schema: '',
    ...Object.fromEntries(
      wrapperMeta.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    ),
    tables: [] as Array<FormattedWrapperTable>,
  }

  const formSchema = getWrapperCreationFormSchema(wrapperMeta)
  type FormSchema = z.infer<typeof formSchema>
  const form = useForm<FormSchema>({
    defaultValues: initialValues,
    resolver: zodResolver(formSchema),
  })

  const { getValues, setError } = form
  const { errors, isDirty, isSubmitting } = form.formState

  useEffect(() => {
    onDirty(isDirty)
  }, [onDirty, isDirty])

  const {
    fields: tablesField,
    append: appendTable,
    remove: removeTable,
    insert: insertTable,
  } = useFieldArray({
    control: form.control,
    name: 'tables',
  })

  const { mutateAsync: createSchema, isPending: isCreatingSchema } = useSchemaCreateMutation()

  const onUpdateTable = (values: FormattedWrapperTable) => {
    if (values.index !== undefined) {
      removeTable(values.index)
      insertTable(values.index, values)
    } else {
      appendTable(values)
    }
    setSelectedTableToEdit(undefined)
  }

  const { mutateAsync: createFDW, isPending: isCreatingWrapper } = useFDWCreateMutation({
    onSuccess: (data) => {
      toast.success(`Successfully created ${wrapperMeta?.label} foreign data wrapper`)

      const { tables } = getValues()
      const hasNewSchema = (tables as Record<string, any>[]).some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, project?.ref)

      onClose()
      form.reset()
    },
  })

  const onSubmit: SubmitHandler<FormSchema> = async (values) => {
    const { mode, tables = [], ...wrapperValues } = values
    if (mode === 'tables' && tables.length === 0) {
      setError('tables', {
        type: 'validate',
        message: 'Please provide at least one table.',
      })
      return
    }
    if (mode === 'schema') {
      const foundSchema = schemas?.find((s) => s.name === wrapperValues.target_schema)
      if (foundSchema) {
        setError('target_schema', {
          type: 'validate',
          message: 'This schema already exists. Please specify a unique schema name.',
        })
        return
      }
    }

    try {
      if (mode === 'schema') {
        await createSchema({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: wrapperValues.target_schema,
        })
      }

      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapperMeta,
        formState: {
          ...wrapperValues,
          server_name: `${wrapperValues.wrapper_name}_server`,
          supabase_target_schema: mode === 'schema' ? wrapperValues.target_schema : undefined,
        },
        mode: mode === 'schema' ? (wrapperMeta.sourceSchemaOption ? 'schema' : 'skip') : 'tables',
        tables,
        sourceSchema: wrapperValues.source_schema,
        targetSchema: wrapperValues.target_schema,
      })

      sendEvent({
        action: 'foreign_data_wrapper_created',
        properties: {
          wrapperType: wrapperMeta.label,
        },
        groups: {
          project: project?.ref ?? 'Unknown',
          organization: org?.slug ?? 'Unknown',
        },
      })
    } catch (error) {
      console.error(error)
      // The error will be handled by the mutation onError callback (toast.error)
    }
  }

  const isLoading = isCreatingWrapper || isCreatingSchema
  const wrapper_name = useWatch({ name: 'wrapper_name', control: form.control })
  const mode = useWatch({ name: 'mode', control: form.control })

  return (
    <>
      <div className="h-full" tabIndex={-1}>
        <Form_Shadcn_ {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>Create a {wrapperMeta.label} wrapper</SheetTitle>
            </SheetHeader>
            <SheetSection className="flex-grow overflow-y-auto">
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Wrapper Configuration</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    <CardContent>
                      <FormField_Shadcn_
                        control={form.control}
                        name="wrapper_name"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="vertical"
                            label="Wrapper Name"
                            name="wrapper_name"
                            description={
                              wrapper_name.length > 0 ? (
                                <>
                                  Your wrapper's server name will be{' '}
                                  <code className="text-code-inline">{wrapper_name}_server</code>
                                </>
                              ) : (
                                ''
                              )
                            }
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ id="wrapper_name" {...field} />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                  </Card>
                </PageSectionContent>
              </PageSection>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>{wrapperMeta.label} Configuration</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    {wrapperMeta.server.options
                      .filter((option) => !option.hidden)
                      .map((option) => (
                        <CardContent key={option.name}>
                          <InputField option={option} control={form.control} />
                        </CardContent>
                      ))}
                  </Card>
                </PageSectionContent>
              </PageSection>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Data target</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <FormField_Shadcn_
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItemLayout layout="vertical">
                        <FormControl_Shadcn_>
                          <RadioGroupStacked
                            value={field.value as string}
                            onValueChange={field.onChange}
                          >
                            <RadioGroupStackedItem
                              key="tables"
                              value="tables"
                              disabled={wrapperMeta.tables.length === 0}
                              label="Tables"
                              showIndicator={false}
                            >
                              <div className="flex  gap-x-5">
                                <div className="flex flex-col">
                                  <p className="text-foreground-light text-left">
                                    Create foreign tables to query data from {wrapperMeta.label}.
                                  </p>
                                </div>
                              </div>
                              {wrapperMeta.tables.length === 0 ? (
                                <div className="w-full flex gap-x-2 py-2 items-center">
                                  <WarningIcon />
                                  <span className="text-xs">
                                    This wrapper doesn't support using foreign tables.
                                  </span>
                                </div>
                              ) : null}
                            </RadioGroupStackedItem>
                            <RadioGroupStackedItem
                              key="schema"
                              value="schema"
                              disabled={
                                !wrapperMeta.canTargetSchema || !hasRequiredVersionForeignSchema
                              }
                              label="Schema"
                              showIndicator={false}
                            >
                              <div className="flex  gap-x-5">
                                <div className="flex flex-col">
                                  <p className="text-foreground-light text-left">
                                    Create all foreign tables from {wrapperMeta.label} in a
                                    specified schema.
                                  </p>
                                </div>
                              </div>
                              {wrapperMeta.canTargetSchema ? (
                                hasRequiredVersionForeignSchema ? null : (
                                  <div className="w-full flex gap-x-2 py-2 items-center">
                                    <WarningIcon />
                                    <span className="text-xs text-left">
                                      This feature requires the{' '}
                                      <span className="text-brand">wrappers</span> extension to be
                                      of minimum version of 0.5.0.
                                    </span>
                                  </div>
                                )
                              ) : (
                                <div className="w-full flex gap-x-2 py-2 items-center">
                                  <WarningIcon />
                                  <span className="text-xs">
                                    This wrapper doesn't support using a foreign schema.
                                  </span>
                                </div>
                              )}
                            </RadioGroupStackedItem>
                          </RadioGroupStacked>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                </PageSectionContent>
              </PageSection>
              {mode === 'tables' && (
                <PageSection>
                  <PageSectionMeta>
                    <PageSectionSummary>
                      <PageSectionTitle>Foreign Tables</PageSectionTitle>
                      <PageSectionDescription>
                        You can query your data from these foreign tables after the wrapper is
                        created
                      </PageSectionDescription>
                    </PageSectionSummary>
                  </PageSectionMeta>
                  <PageSectionContent className="flex flex-col space-y-2">
                    {tablesField.map((t, tableIndex) => {
                      // FIXME: make inference work
                      const table = t as unknown as FormattedWrapperTable
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
                        >
                          <div>
                            <p className="text-sm">
                              {table.schema_name}.{table.table_name}
                            </p>
                            <p className="text-sm text-foreground-light">
                              Columns: {table.columns.map((column: any) => column.name).join(', ')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="default"
                              className="px-1"
                              icon={<Edit />}
                              onClick={() => {
                                setSelectedTableToEdit(table)
                              }}
                            />
                            <Button
                              type="default"
                              className="px-1"
                              icon={<Trash />}
                              onClick={() => {
                                removeTable(tableIndex)
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}

                    <div className="flex justify-end">
                      <Button type="default" onClick={() => setSelectedTableToEdit(NewTable)}>
                        Add foreign table
                      </Button>
                    </div>
                    {tablesField.length === 0 && errors.tables && (
                      <p className="text-sm text-right text-red-900">
                        {errors.tables.message?.toString()}
                      </p>
                    )}
                  </PageSectionContent>
                </PageSection>
              )}
              {mode === 'schema' && (
                <PageSection>
                  <PageSectionMeta>
                    <PageSectionSummary>
                      <PageSectionTitle>Foreign Schema</PageSectionTitle>
                      <PageSectionDescription>
                        You can query your data from the foreign tables in the specified schema
                        after the wrapper is created.
                      </PageSectionDescription>
                    </PageSectionSummary>
                  </PageSectionMeta>
                  <PageSectionContent>
                    {wrapperMeta.sourceSchemaOption &&
                      !wrapperMeta.sourceSchemaOption?.readOnly && (
                        // Hide the field if the source schema is read-only
                        <InputField
                          key="source_schema"
                          option={wrapperMeta.sourceSchemaOption}
                          control={form.control}
                        />
                      )}
                    <div className="flex flex-col gap-2">
                      <InputField
                        key="target_schema"
                        option={{
                          name: 'target_schema',
                          label: 'Specify a new schema to create all wrapper tables in',
                          description:
                            'A new schema will be created. For security purposes, the wrapper tables from the foreign schema cannot be created within an existing schema.',
                          required: true,
                          encrypted: false,
                          secureEntry: false,
                        }}
                        control={form.control}
                      />
                    </div>
                  </PageSectionContent>
                </PageSection>
              )}
            </SheetSection>
            <SheetFooter>
              <Button
                size="tiny"
                type="default"
                htmlType="button"
                onClick={onCloseWithConfirmation}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="tiny"
                type="primary"
                form={FORM_ID}
                htmlType="submit"
                disabled={isSubmitting || isLoading}
                loading={isLoading}
              >
                Create wrapper
              </Button>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </div>

      <WrapperTableEditor
        visible={selectedTableToEdit != null}
        tables={wrapperMeta.tables}
        onCancel={() => {
          setSelectedTableToEdit(undefined)
        }}
        onSave={onUpdateTable}
        initialData={selectedTableToEdit}
      />
    </>
  )
}
