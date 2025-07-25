import { useQueryClient } from '@tanstack/react-query'
import { isEmpty } from 'lodash'
import { Edit, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { invalidateSchemasQuery, useSchemasQuery } from 'data/database/schemas-query'
import { useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Form,
  Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  WarningIcon,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import InputField from './InputField'
import { WrapperMeta } from './Wrappers.types'
import { makeValidateRequired } from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'

export interface CreateWrapperSheetProps {
  isClosing: boolean
  wrapperMeta: WrapperMeta
  setIsClosing: (v: boolean) => void
  onClose: () => void
}

const FORM_ID = 'create-wrapper-form'

export const CreateWrapperSheet = ({
  wrapperMeta,
  isClosing,
  setIsClosing,
  onClose,
}: CreateWrapperSheetProps) => {
  const queryClient = useQueryClient()

  const { project } = useProjectContext()
  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()

  const [newTables, setNewTables] = useState<any[]>([])
  const [isEditingTable, setIsEditingTable] = useState(false)
  const [createSchemaSheetOpen, setCreateSchemaSheetOpen] = useState(false)
  const [selectedTableToEdit, setSelectedTableToEdit] = useState()
  const [selectedMode, setSelectedMode] = useState<'tables' | 'schema'>(
    wrapperMeta.tables.length > 0 ? 'tables' : 'schema'
  )

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const wrappersExtension = extensions?.find((ext) => ext.name === 'wrappers')
  // The import foreign schema requires a minimum extension version of 0.5.0
  const hasRequiredVersionForeignSchema = wrappersExtension?.installed_version
    ? wrappersExtension?.installed_version >= '0.5.0'
    : false

  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({})

  const { mutateAsync: createFDW, isLoading: isCreatingWrapper } = useFDWCreateMutation({
    onSuccess: () => {
      toast.success(`Successfully created ${wrapperMeta?.label} foreign data wrapper`)
      setNewTables([])

      const hasNewSchema = newTables.some((table) => table.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, project?.ref)

      onClose()
    },
  })

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref!,
    connectionString: project?.connectionString,
  })

  const initialValues = {
    wrapper_name: '',
    server_name: '',
    source_schema: wrapperMeta.sourceSchemaOption?.defaultValue ?? '',
    target_schema: '',
    ...Object.fromEntries(
      wrapperMeta.server.options.map((option) => [option.name, option.defaultValue ?? ''])
    ),
  }

  const { mutateAsync: createSchema, isLoading: isCreatingSchema } = useSchemaCreateMutation()

  const onUpdateTable = (values: any) => {
    setNewTables((prev) => {
      // if the new values have tableIndex, we are editing an existing table
      if (values.tableIndex !== undefined) {
        const tableIndex = values.tableIndex
        const newTables = [...prev]
        delete values.tableIndex
        newTables[tableIndex] = values
        return newTables
      }
      return [...prev, values]
    })
    setIsEditingTable(false)
    setSelectedTableToEdit(undefined)
  }

  const onSubmit = async (values: any) => {
    const validate = makeValidateRequired(wrapperMeta.server.options)
    const errors: any = validate(values)

    if (values.wrapper_name.length === 0) {
      errors.wrapper_name = 'Please provide a name for your wrapper'
    }

    if (selectedMode === 'tables') {
      if (newTables.length === 0) {
        errors.tables = 'Please provide at least one table'
      }
    }
    if (selectedMode === 'schema') {
      if (values.source_schema.length === 0) {
        errors.source_schema = 'Please provide a source schema'
      }
      if (values.target_schema.length === 0) {
        errors.target_schema = 'Please provide an unique target schema'
      }
      const foundSchema = schemas?.find((s) => s.name === values.target_schema)
      if (foundSchema) {
        errors.target_schema = 'This schema already exists. Please specify a unique schema name.'
      }
    }

    setFormErrors(errors)
    if (!isEmpty(errors)) {
      return
    }

    try {
      await createSchema({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        name: values.target_schema,
      })

      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapperMeta,
        formState: {
          ...values,
          server_name: `${values.wrapper_name}_server`,
          supabase_target_schema: selectedMode === 'schema' ? values.target_schema : undefined,
        },
        mode: selectedMode,
        tables: newTables,
        sourceSchema: values.source_schema,
        targetSchema: values.target_schema,
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

  return (
    <>
      <div className="h-full" tabIndex={-1}>
        <Form
          id={FORM_ID}
          initialValues={initialValues}
          onSubmit={onSubmit}
          className="flex-grow flex flex-col h-full"
        >
          {({ values, initialValues, setFieldValue }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

            const onClosePanel = () => {
              if (hasChanges) {
                setIsClosing(true)
              } else {
                onClose()
              }
            }

            // if the form hasn't been touched and the user clicked esc or the backdrop, close the sheet
            if (!hasChanges && isClosing) {
              onClose()
            }

            return (
              <>
                <SheetHeader>
                  <SheetTitle>Create a {wrapperMeta.label} wrapper</SheetTitle>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto">
                  <FormSection header={<FormSectionLabel>Wrapper Configuration</FormSectionLabel>}>
                    <FormSectionContent loading={false}>
                      <Input
                        id="wrapper_name"
                        label="Wrapper Name"
                        error={formErrors.wrapper_name}
                        descriptionText={
                          (values?.wrapper_name ?? '').length > 0 ? (
                            <>
                              Your wrapper's server name will be{' '}
                              <code className="text-xs">{values.wrapper_name}_server</code>
                            </>
                          ) : (
                            ''
                          )
                        }
                      />
                    </FormSectionContent>
                  </FormSection>
                  <Separator />
                  <FormSection
                    header={<FormSectionLabel>{wrapperMeta.label} Configuration</FormSectionLabel>}
                  >
                    <FormSectionContent loading={false}>
                      {wrapperMeta.server.options
                        .filter((option) => !option.hidden)
                        .map((option) => (
                          <InputField
                            key={option.name}
                            option={option}
                            loading={false}
                            error={formErrors[option.name]}
                          />
                        ))}
                    </FormSectionContent>
                  </FormSection>
                  <Separator />
                  <FormSection header={<FormSectionLabel>Data target</FormSectionLabel>}>
                    <FormSectionContent loading={false} className="text-sm">
                      <RadioGroupStacked
                        value={selectedMode}
                        onValueChange={(value) => setSelectedMode(value as 'tables' | 'schema')}
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
                                Create all foreign tables from {wrapperMeta.label} in a specified
                                schema.
                              </p>
                            </div>
                          </div>
                          {wrapperMeta.canTargetSchema ? (
                            hasRequiredVersionForeignSchema ? null : (
                              <div className="w-full flex gap-x-2 py-2 items-center">
                                <WarningIcon />
                                <span className="text-xs text-left">
                                  This feature requires the{' '}
                                  <span className="text-brand">wrappers</span> extension to be of
                                  minimum version of 0.5.0.
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
                    </FormSectionContent>
                  </FormSection>
                  <Separator />
                  {selectedMode === 'tables' && (
                    <FormSection
                      header={
                        <FormSectionLabel>
                          <p>Foreign Tables</p>
                          <p className="text-foreground-light mt-2 w-[90%]">
                            You can query your data from these foreign tables after the wrapper is
                            created
                          </p>
                        </FormSectionLabel>
                      }
                    >
                      <FormSectionContent loading={false}>
                        {newTables.length === 0 ? (
                          <div className="flex justify-end translate-y-4">
                            <Button type="default" onClick={() => setIsEditingTable(true)}>
                              Add foreign table
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {newTables.map((table, i) => (
                              <div
                                key={`${table.schema_name}.${table.table_name}`}
                                className="flex items-center justify-between px-4 py-2 border rounded-md border-control"
                              >
                                <div>
                                  <p className="text-sm">
                                    {table.schema_name}.{table.table_name}
                                  </p>
                                  <p className="text-sm text-foreground-light">
                                    Columns:{' '}
                                    {table.columns.map((column: any) => column.name).join(', ')}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    type="default"
                                    className="px-1"
                                    icon={<Edit />}
                                    onClick={() => {
                                      setIsEditingTable(true)
                                      setSelectedTableToEdit({ ...table, tableIndex: i })
                                    }}
                                  />
                                  <Button
                                    type="default"
                                    className="px-1"
                                    icon={<Trash />}
                                    onClick={() => {
                                      setNewTables((prev) => prev.filter((_, j) => j !== i))
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {newTables.length > 0 && (
                          <div className="flex justify-end">
                            <Button type="default" onClick={() => setIsEditingTable(true)}>
                              Add foreign table
                            </Button>
                          </div>
                        )}
                        {newTables.length === 0 && formErrors.tables && (
                          <p className="text-sm text-right text-red-900">{formErrors.tables}</p>
                        )}
                      </FormSectionContent>
                    </FormSection>
                  )}
                  {selectedMode === 'schema' && (
                    <FormSection
                      header={
                        <FormSectionLabel>
                          <p>Foreign Schema</p>
                          <p className="text-foreground-light mt-2 w-[90%]">
                            You can query your data from the foreign tables in the specified schema
                            after the wrapper is created.
                          </p>
                        </FormSectionLabel>
                      }
                    >
                      <FormSectionContent loading={false}>
                        {wrapperMeta.sourceSchemaOption &&
                          !wrapperMeta.sourceSchemaOption?.readOnly && (
                            // Hide the field if the source schema is read-only
                            <div>
                              <InputField
                                key="source_schema"
                                option={wrapperMeta.sourceSchemaOption}
                                loading={false}
                                error={formErrors['source_schema']}
                              />
                              <p className="text-foreground-lighter text-sm">
                                {wrapperMeta.sourceSchemaOption.description}
                              </p>
                            </div>
                          )}
                        <div className="flex flex-col gap-2">
                          <InputField
                            key="target_schema"
                            option={{
                              name: 'target_schema',
                              label: 'Specify a new schema to create all wrapper tables in',
                              required: true,
                              encrypted: false,
                              secureEntry: false,
                            }}
                            loading={false}
                            error={formErrors['target_schema']}
                          />
                          <p className="text-foreground-lighter text-sm">
                            A new schema will be created. For security purposes, the wrapper tables
                            from the foreign schema cannot be created within an existing schema
                          </p>
                        </div>
                      </FormSectionContent>
                    </FormSection>
                  )}
                </div>

                <SheetFooter>
                  <Button
                    size="tiny"
                    type="default"
                    htmlType="button"
                    onClick={onClosePanel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="tiny"
                    type="primary"
                    form={FORM_ID}
                    htmlType="submit"
                    loading={isLoading}
                  >
                    Create wrapper
                  </Button>
                </SheetFooter>
              </>
            )
          }}
        </Form>
      </div>
      <ConfirmationModal
        visible={isClosing}
        title="Discard changes"
        confirmLabel="Discard"
        onCancel={() => setIsClosing(false)}
        onConfirm={() => onClose()}
      >
        <p className="text-sm text-foreground-light">
          There are unsaved changes. Are you sure you want to close the panel? Your changes will be
          lost.
        </p>
      </ConfirmationModal>

      <WrapperTableEditor
        visible={isEditingTable}
        tables={wrapperMeta.tables}
        onCancel={() => {
          setSelectedTableToEdit(undefined)
          setIsEditingTable(false)
        }}
        onSave={onUpdateTable}
        initialData={selectedTableToEdit}
      />
    </>
  )
}
