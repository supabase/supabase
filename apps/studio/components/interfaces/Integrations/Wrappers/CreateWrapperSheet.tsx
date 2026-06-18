import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Edit, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import InputField from './InputField'
import { WrapperMeta } from './Wrappers.types'
import {
  FormattedWrapperTable,
  getRequiredExtensionsToInstall,
  getWrapperCreationFormSchema,
  hasForeignSchemaSupport,
  NewTable,
} from './Wrappers.utils'
import WrapperTableEditor from './WrapperTableEditor'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { getExtensionDefaultSchema } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/IntegrationOverviewTabV2.utils'
import { RequiredExtensionsSection } from '@/components/interfaces/Integrations/Integration/RequiredExtensionsSection'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import { useDatabaseExtensionEnableMutation } from '@/data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemaCreateMutation } from '@/data/database/schema-create-mutation'
import { invalidateSchemasQuery, useSchemasQuery } from '@/data/database/schemas-query'
import { useFDWCreateMutation } from '@/data/fdw/fdw-create-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'
import type { ResponseError } from '@/types'

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
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  const { integration } = useIntegrationDetail()

  const { data: project } = useSelectedProjectQuery()
  const track = useTrack()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // null while the query is in flight — distinct from [] which means "all installed"
  const requiredExtensionsToInstall = useMemo(
    () => getRequiredExtensionsToInstall(extensions, integration?.requiredExtensions ?? []),
    [extensions, integration?.requiredExtensions]
  )

  const wrappersExtension = extensions?.find((ext) => ext.name === 'wrappers')
  const hasRequiredVersionForeignSchema = hasForeignSchemaSupport(wrappersExtension)
  const needsExtensions = isMarketplaceEnabled && (requiredExtensionsToInstall?.length ?? 0) > 0
  const isExtensionDataLoading = isMarketplaceEnabled && requiredExtensionsToInstall === null

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

  const [selectedTableToEdit, setSelectedTableToEdit] = useState<FormattedWrapperTable | undefined>(
    undefined
  )

  const { mutateAsync: enableExtension } = useDatabaseExtensionEnableMutation({ onError: () => {} })
  const { mutateAsync: createSchema } = useSchemaCreateMutation({ onError: () => {} })
  const { mutateAsync: createFDW } = useFDWCreateMutation({ onError: () => {} })

  const installRequiredExtensions = async () => {
    if (!project) return
    const { ref: projectRef, connectionString } = project
    const results = await Promise.allSettled(
      (requiredExtensionsToInstall ?? []).map((ext) => {
        const schema = getExtensionDefaultSchema(ext) ?? 'extensions'
        return enableExtension({
          projectRef,
          connectionString,
          schema,
          name: ext.name,
          version: ext.default_version,
          cascade: true,
          createSchema: false,
        })
      })
    )
    const failure = results.find((r) => r.status === 'rejected')
    if (failure) throw new Error((failure as PromiseRejectedResult).reason.message)
  }

  const onUpdateTable = (values: FormattedWrapperTable) => {
    if (values.index !== undefined) {
      removeTable(values.index)
      insertTable(values.index, values)
    } else {
      appendTable(values)
    }
    setSelectedTableToEdit(undefined)
  }

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

    if (isExtensionDataLoading) return

    const toastId = toast.loading(
      needsExtensions
        ? `Installing extensions ${(requiredExtensionsToInstall ?? []).map((e) => e.name).join(', ')}…`
        : `Creating ${wrapperMeta.label} wrapper…`
    )

    try {
      if (needsExtensions) {
        await installRequiredExtensions()
        toast.loading(`Creating ${wrapperMeta.label} wrapper…`, { id: toastId })
      }

      if (mode === 'schema') {
        toast.loading(`Creating schema "${wrapperValues.target_schema}"…`, { id: toastId })
        await createSchema({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: wrapperValues.target_schema,
        })
        toast.loading(`Creating ${wrapperMeta.label} wrapper…`, { id: toastId })
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

      const { tables: formTables } = getValues()
      const hasNewSchema = (formTables as Record<string, any>[]).some((t) => t.is_new_schema)
      if (hasNewSchema) invalidateSchemasQuery(queryClient, project?.ref)

      track('foreign_data_wrapper_created', { wrapperType: wrapperMeta.label })
      toast.success(`Successfully created ${wrapperMeta.label} foreign data wrapper`, {
        id: toastId,
      })
      onClose()
      form.reset()
    } catch (error) {
      toast.error(
        `Failed to create ${wrapperMeta.label} wrapper: ${(error as ResponseError).message}`,
        { id: toastId }
      )
    }
  }

  const wrapper_name = useWatch({ name: 'wrapper_name', control: form.control })
  const mode = useWatch({ name: 'mode', control: form.control })

  return (
    <>
      <div className="h-full" tabIndex={-1}>
        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>Create a {wrapperMeta.label} wrapper</SheetTitle>
            </SheetHeader>
            <div className="grow overflow-y-auto">
              {isMarketplaceEnabled && (
                <div className="px-5 py-5 flex flex-col gap-y-4 border-b">
                  {needsExtensions && (
                    <Admonition
                      type="warning"
                      title="Required extensions will be installed"
                      description="Proceeding will also install the extensions required by this wrapper."
                    />
                  )}
                  <RequiredExtensionsSection hideSeparator />
                </div>
              )}
              <FormSection header={<FormSectionLabel>Wrapper Configuration</FormSectionLabel>}>
                <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                  <FormField
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
                        <FormControl>
                          <Input id="wrapper_name" {...field} />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </FormSectionContent>
              </FormSection>
              <Separator />
              <FormSection
                header={<FormSectionLabel>{wrapperMeta.label} Configuration</FormSectionLabel>}
              >
                <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                  {wrapperMeta.server.options
                    .filter((option) => !option.hidden)
                    .map((option) => (
                      <InputField option={option} control={form.control} key={option.name} />
                    ))}
                </FormSectionContent>
              </FormSection>
              <Separator />
              <FormSection header={<FormSectionLabel>Data target</FormSectionLabel>}>
                <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItemLayout layout="vertical">
                        <FormControl>
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
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                </FormSectionContent>
              </FormSection>
              <Separator />
              {mode === 'tables' && (
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
                  <FormSectionContent className="flex flex-col space-y-2" loading={false}>
                    <div className="flex flex-col space-y-2">
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
                                Columns:{' '}
                                {(table.columns ?? []).map((column: any) => column.name).join(', ')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="default"
                                className="px-1"
                                icon={<Edit />}
                                onClick={() => {
                                  setSelectedTableToEdit(table)
                                }}
                              />
                              <Button
                                variant="default"
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
                        <Button variant="default" onClick={() => setSelectedTableToEdit(NewTable)}>
                          Add foreign table
                        </Button>
                      </div>
                      {tablesField.length === 0 && errors.tables && (
                        <p className="text-sm text-right text-red-900">
                          {errors.tables.message?.toString()}
                        </p>
                      )}
                    </div>
                  </FormSectionContent>
                </FormSection>
              )}
              <Separator />
              {mode === 'schema' && (
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
                  <FormSectionContent className="flex flex-col space-y-2" loading={false}>
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
                  </FormSectionContent>
                </FormSection>
              )}
            </div>
            <SheetFooter>
              <Button
                size="tiny"
                variant="default"
                type="button"
                onClick={onCloseWithConfirmation}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="tiny"
                variant="primary"
                form={FORM_ID}
                type="submit"
                disabled={isSubmitting || isExtensionDataLoading}
                loading={isSubmitting}
              >
                Create wrapper
              </Button>
            </SheetFooter>
          </form>
        </Form>
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
