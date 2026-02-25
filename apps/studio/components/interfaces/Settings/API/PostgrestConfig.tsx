import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { indexOf } from 'lodash'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Skeleton,
} from 'ui'
import { GenericSkeletonLoader, PageSection, PageSectionContent } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { z } from 'zod'

import TableSelector from '../../Realtime/Inspector/RealtimeFilterPopover/TableSelector'
import { ExposedSchemasList } from './ExposedSchemasList'
import { ExposedTablesList } from './ExposedTablesList'
import { HardenAPIModal } from './HardenAPIModal'
import { FormActions } from '@/components/ui/Forms/FormActions'
import SchemaSelector from '@/components/ui/SchemaSelector'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from '@/data/config/project-postgrest-config-update-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useDataApiGrantTogglesEnabled } from '@/hooks/misc/useDataApiGrantTogglesEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

const formSchema = z.object({
  // Fields for updatePostgrestConfig
  dbSchema: z.array(z.string()),
  dbExtraSearchPath: z.array(z.string()),
  maxRows: z.number().max(1000000, "Can't be more than 1,000,000"),
  dbPool: z
    .number()
    .min(0, 'Must be more than 0')
    .max(1000, "Can't be more than 1000")
    .optional()
    .nullable(),

  // Fields for expose mode
  exposeMode: z.enum(['schemas', 'specific']),
  // For exposeMode = 'specific
  tableIdsToAdd: z.array(z.number()),
  tableIdsToRemove: z.array(z.number()),
})

export const PostgrestConfig = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isApiGrantTogglesEnabled = useDataApiGrantTogglesEnabled()

  const [showModal, setShowModal] = useState(false)

  const {
    data: config,
    isError,
    isPending: isLoadingConfig,
    isSuccess: isSuccessConfig,
  } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: allSchemas = [],
    isPending: isLoadingSchemas,
    isSuccess: isSuccessSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isLoading = isLoadingConfig || isLoadingSchemas

  const schemas = useMemo(
    () =>
      allSchemas
        .filter((x) => {
          const find = indexOf(INTERNAL_SCHEMAS, x.name)
          if (find < 0) return x
        })
        .map((x) => {
          return {
            id: x.id,
            value: x.name,
            name: x.name,
            disabled: false,
          }
        }) ?? [],
    [allSchemas]
  )

  const { mutate: updatePostgrestConfig, isPending: isUpdating } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully saved settings')
      },
    })

  const formId = 'project-postgres-config'

  const { can: canUpdatePostgrestConfig, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.UPDATE, 'custom_config_postgrest')

  const isGraphqlExtensionEnabled =
    (extensions ?? []).find((ext) => ext.name === 'pg_graphql')?.installed_version !== null

  const defaultValues = useMemo(() => {
    const dbSchema = config?.db_schema ? config?.db_schema.split(',').map((x) => x.trim()) : []
    return {
      dbSchema,
      maxRows: config?.max_rows,
      // TODO: only display schemas that exist in the db
      dbExtraSearchPath: (config?.db_extra_search_path ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      dbPool: config?.db_pool,
      exposeMode: 'schemas' as const,
      tableIdsToAdd: [] as number[],
      tableIdsToRemove: [] as number[],
    }
  }, [config])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues,
  })

  const resetForm = useCallback(() => {
    form.reset({ ...defaultValues })
  }, [form, defaultValues])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!projectRef) return console.error('Project ref is required') // is this needed ?

    updatePostgrestConfig({
      projectRef,
      dbSchema: values.dbSchema.join(','),
      maxRows: values.maxRows,
      dbExtraSearchPath: values.dbExtraSearchPath.join(','),
      dbPool: values.dbPool ? values.dbPool : null,
    })
  }

  useEffect(() => {
    if (isSuccessConfig && isSuccessSchemas) {
      resetForm()
    }
  }, [isSuccessConfig, isSuccessSchemas, resetForm])

  const watchedExposeMode = form.watch('exposeMode')
  const watchedDbSchema = form.watch('dbSchema')
  const watchedTableIdsToRemove = form.watch('tableIdsToRemove')

  const excludedSchemas = useMemo(() => {
    return (
      INTERNAL_SCHEMAS
        // Allow exposing graphql_public schema
        .filter((schema) => schema !== 'graphql_public')
        // Exclude schemas that are already exposed
        .concat(watchedDbSchema)
    )
  }, [watchedDbSchema])

  return (
    <PageSection id="postgrest-config" className="first:pt-0">
      <PageSectionContent>
        <Card className="mb-4">
          <Form_Shadcn_ {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
              {isLoading ? (
                <CardContent>
                  <GenericSkeletonLoader />
                </CardContent>
              ) : isError ? (
                <CardContent>
                  <Admonition type="destructive" title="Failed to retrieve API settings" />
                </CardContent>
              ) : (
                <>
                  {isApiGrantTogglesEnabled ? (
                    <CardContent className="space-y-6 p-6">
                      <FormField_Shadcn_
                        control={form.control}
                        name="exposeMode"
                        render={({ field }) => (
                          <FormItem_Shadcn_>
                            <FormItemLayout
                              layout="flex-row-reverse"
                              label="Expose mode"
                              description="Choose whether to expose complete schemas or specific tables."
                            >
                              <FormControl_Shadcn_>
                                <RadioGroupStacked
                                  id="expose-mode"
                                  name="expose-mode"
                                  value={field.value}
                                  disabled={!canUpdatePostgrestConfig}
                                  onValueChange={(value) =>
                                    field.onChange(value as 'schemas' | 'specific')
                                  }
                                >
                                  <RadioGroupStackedItem
                                    id="schemas"
                                    value="schemas"
                                    label=""
                                    showIndicator={false}
                                    className="text-left justify-start items-start"
                                  >
                                    <div className="flex flex-col">
                                      <p className="text-foreground">Schemas</p>
                                      <p className="text-foreground-light text-sm">
                                        Expose all tables in selected schemas.
                                      </p>
                                    </div>
                                  </RadioGroupStackedItem>
                                  <RadioGroupStackedItem
                                    id="specific"
                                    value="specific"
                                    label=""
                                    showIndicator={false}
                                    className="text-left justify-start items-start"
                                  >
                                    <div className="flex flex-col">
                                      <p className="text-foreground">Specific tables</p>
                                      <p className="text-foreground-light text-sm">
                                        Expose only selected tables.
                                      </p>
                                    </div>
                                  </RadioGroupStackedItem>
                                </RadioGroupStacked>
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          </FormItem_Shadcn_>
                        )}
                      />

                      {watchedExposeMode === 'schemas' ? (
                        <>
                          <FormField_Shadcn_
                            control={form.control}
                            name="dbSchema"
                            render={({ field }) => (
                              <FormItem_Shadcn_>
                                <FormItemLayout
                                  layout="flex-row-reverse"
                                  label="Exposed schemas"
                                  description="Select schemas to fully expose through the Data API."
                                >
                                  <SchemaSelector
                                    excludedSchemas={excludedSchemas}
                                    size="small"
                                    onSelectSchema={(name) => {
                                      field.onChange([name, ...field.value])
                                    }}
                                    placeholderLabel="Select schemas to expose..."
                                    disabled={!canUpdatePostgrestConfig}
                                  />
                                </FormItemLayout>
                              </FormItem_Shadcn_>
                            )}
                          />

                          <ExposedSchemasList
                            schemas={watchedDbSchema}
                            onRemoveSchema={(schema) => {
                              form.setValue(
                                'dbSchema',
                                form.getValues('dbSchema').filter((x) => x !== schema)
                              )
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <FormField_Shadcn_
                            control={form.control}
                            name="tableIdsToAdd"
                            render={({ field }) => (
                              <FormItem_Shadcn_>
                                <FormItemLayout
                                  layout="flex-row-reverse"
                                  label="Exposed tables"
                                  description="Grant Data API access to selected tables."
                                >
                                  <TableSelector
                                    selectedSchemaName="*"
                                    onSelectTable={(_name, tableId) => {
                                      field.onChange([...field.value, tableId])
                                    }}
                                  />
                                </FormItemLayout>
                              </FormItem_Shadcn_>
                            )}
                          />

                          <ExposedTablesList
                            tableIdsPendingRemoval={watchedTableIdsToRemove}
                            onRemoveTable={(tableId) => {
                              const tableIdsToAdd = form.getValues('tableIdsToAdd')
                              const tableIdsToRemove = form.getValues('tableIdsToRemove')

                              if (tableIdsToAdd.includes(tableId)) {
                                form.setValue(
                                  'tableIdsToAdd',
                                  tableIdsToAdd.filter((x) => x !== tableId)
                                )
                              } else {
                                form.setValue('tableIdsToRemove', [...tableIdsToRemove, tableId])
                              }
                            }}
                          />
                        </>
                      )}

                      {watchedDbSchema.length === 0 && (
                        <Admonition
                          type="warning"
                          title="No schema is currently selected"
                          description="Saving with no selected schema or table will disable the Data API."
                        />
                      )}
                    </CardContent>
                  ) : (
                    <CardContent>
                      <FormField_Shadcn_
                        control={form.control}
                        name="dbSchema"
                        render={({ field }) => (
                          <FormItem_Shadcn_>
                            <FormItemLayout
                              label="Exposed schemas"
                              description="The schemas to expose in your API. Tables, views and stored procedures in
                          these schemas will get API endpoints."
                              layout="flex-row-reverse"
                            >
                              {isLoadingSchemas ? (
                                <div className="col-span-12 flex flex-col gap-2 lg:col-span-7">
                                  <Skeleton className="w-full h-[38px]" />
                                </div>
                              ) : (
                                <MultiSelector
                                  onValuesChange={field.onChange}
                                  values={field.value}
                                  size="small"
                                  disabled={!canUpdatePostgrestConfig}
                                >
                                  <MultiSelectorTrigger
                                    mode="inline-combobox"
                                    label="Select schemas..."
                                    badgeLimit="wrap"
                                    showIcon={false}
                                    deletableBadge
                                  />
                                  <MultiSelectorContent>
                                    <MultiSelectorList>
                                      {schemas.length <= 0 ? (
                                        <MultiSelectorItem key="empty" value="no">
                                          no
                                        </MultiSelectorItem>
                                      ) : (
                                        schemas.map((x) => (
                                          <MultiSelectorItem
                                            key={x.id + '-' + x.name}
                                            value={x.name}
                                          >
                                            {x.name}
                                          </MultiSelectorItem>
                                        ))
                                      )}
                                    </MultiSelectorList>
                                  </MultiSelectorContent>
                                </MultiSelector>
                              )}
                            </FormItemLayout>
                            {!field.value.includes('public') && field.value.length > 0 && (
                              <Admonition
                                type="default"
                                title="The public schema for this project is not exposed"
                                className="mt-2"
                                description={
                                  <>
                                    <p className="text-sm">
                                      You will not be able to query tables and views in the{' '}
                                      <code className="text-code-inline">public</code> schema via
                                      supabase-js or HTTP clients.
                                    </p>
                                    {isGraphqlExtensionEnabled && (
                                      <>
                                        <p className="text-sm">
                                          Tables in the{' '}
                                          <code className="text-code-inline">public</code> schema
                                          are still exposed over our GraphQL endpoints.
                                        </p>
                                        <Button asChild type="default" className="mt-2">
                                          <Link href={`/project/${projectRef}/database/extensions`}>
                                            Disable the pg_graphql extension
                                          </Link>
                                        </Button>
                                      </>
                                    )}
                                  </>
                                }
                              />
                            )}
                          </FormItem_Shadcn_>
                        )}
                      />
                    </CardContent>
                  )}
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="dbExtraSearchPath"
                      render={({ field }) => (
                        <FormItem_Shadcn_>
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Extra search path"
                            description="Extra schemas to add to the search path of every request."
                          >
                            {isLoadingSchemas ? (
                              <div className="col-span-12 flex flex-col gap-2 lg:col-span-7">
                                <Skeleton className="w-full h-[38px]" />
                              </div>
                            ) : (
                              <MultiSelector
                                onValuesChange={field.onChange}
                                values={field.value}
                                size="small"
                                disabled={!canUpdatePostgrestConfig}
                              >
                                <MultiSelectorTrigger
                                  mode="inline-combobox"
                                  label="Select schemas..."
                                  badgeLimit="wrap"
                                  showIcon={false}
                                  deletableBadge
                                />
                                <MultiSelectorContent>
                                  <MultiSelectorList>
                                    {allSchemas.length <= 0 ? (
                                      <MultiSelectorItem key="empty" value="no">
                                        no
                                      </MultiSelectorItem>
                                    ) : (
                                      allSchemas.map((x) => (
                                        <MultiSelectorItem key={x.id + '-' + x.name} value={x.name}>
                                          {x.name}
                                        </MultiSelectorItem>
                                      ))
                                    )}
                                  </MultiSelectorList>
                                </MultiSelectorContent>
                              </MultiSelector>
                            )}
                          </FormItemLayout>
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="maxRows"
                      render={({ field }) => (
                        <FormItem_Shadcn_>
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Max rows"
                            description="The maximum number of rows returned from a view, table, or stored procedure. Limits payload size for accidental or malicious requests."
                          >
                            <FormControl_Shadcn_>
                              <PrePostTab postTab="rows">
                                <Input_Shadcn_
                                  size="small"
                                  disabled={!canUpdatePostgrestConfig}
                                  {...field}
                                  type="number"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </PrePostTab>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="dbPool"
                      render={({ field }) => (
                        <FormItem_Shadcn_>
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Pool size"
                            description="Number of maximum connections to keep open in the Data API server's database pool. Unset to let it be configured automatically based on compute size."
                          >
                            <FormControl_Shadcn_>
                              <PrePostTab postTab="connections">
                                <Input_Shadcn_
                                  size="small"
                                  disabled={!canUpdatePostgrestConfig}
                                  {...field}
                                  type="number"
                                  placeholder="Configured automatically"
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value === '' ? null : Number(e.target.value)
                                    )
                                  }
                                  value={field.value === null ? '' : field.value}
                                />
                              </PrePostTab>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                </>
              )}
            </form>
          </Form_Shadcn_>
          <CardFooter className="border-t">
            <FormActions
              form={formId}
              isSubmitting={isUpdating}
              hasChanges={form.formState.isDirty}
              handleReset={resetForm}
              disabled={!canUpdatePostgrestConfig}
              helper={
                isPermissionsLoaded && !canUpdatePostgrestConfig
                  ? "You need additional permissions to update your project's API settings"
                  : undefined
              }
            />
          </CardFooter>
        </Card>
        <Card className="mb-4">
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              layout="flex-row-reverse"
              label="Harden Data API"
              description="Expose a custom schema instead of the public schema"
            >
              <div className="flex gap-2 items-center justify-end">
                <Button type="default" icon={<Lock />} onClick={() => setShowModal(true)}>
                  Harden Data API
                </Button>
              </div>
            </FormItemLayout>
          </CardContent>
        </Card>
      </PageSectionContent>

      <HardenAPIModal visible={showModal} onClose={() => setShowModal(false)} />
    </PageSection>
  )
}
