import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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

import { ExposedSchemaSelector } from './ExposedSchemaSelector'
import { HardenAPIModal } from './HardenAPIModal'
import { ExposedTableSelector } from '@/components/interfaces/Settings/API/ExposedTableSelector'
import { FormActions } from '@/components/ui/Forms/FormActions'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from '@/data/config/project-postgrest-config-update-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { type ExposeMode, exposeModeQueryOptions } from '@/data/privileges/expose-mode-query'
import { privilegeKeys } from '@/data/privileges/keys'
import { useUpdateExposedTablesMutation } from '@/data/privileges/update-exposed-tables-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useDataApiGrantTogglesEnabled } from '@/hooks/misc/useDataApiGrantTogglesEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'
import { noop } from '@/lib/void'
import type { ResponseError } from '@/types'

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
  const queryClient = useQueryClient()
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

  const configDbSchemas = useMemo(
    () => (config?.db_schema ? config.db_schema.split(',').map((x) => x.trim()) : []),
    [config?.db_schema]
  )

  const {
    data: exposeMode,
    isPending: isLoadingExposeMode,
    isError: isExposeModeError,
    isSuccess: isSuccessExposeMode,
  } = useQuery(
    exposeModeQueryOptions(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schemas: configDbSchemas,
      },
      { enabled: isSuccessConfig && isApiGrantTogglesEnabled }
    )
  )

  const isLoading =
    isLoadingConfig || isLoadingSchemas || (isApiGrantTogglesEnabled && isLoadingExposeMode)

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

  const { mutateAsync: updatePostgrestConfig } = useProjectPostgrestConfigUpdateMutation()

  const { mutateAsync: updateExposedTables } = useUpdateExposedTablesMutation()

  const [isUpdating, setIsUpdating] = useState(false)

  const formId = 'project-postgres-config'

  const { can: canUpdatePostgrestConfig, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.UPDATE, 'custom_config_postgrest')

  const isGraphqlExtensionEnabled =
    (extensions ?? []).find((ext) => ext.name === 'pg_graphql')?.installed_version !== null

  const defaultValues = useMemo(() => {
    return {
      dbSchema: configDbSchemas,
      maxRows: config?.max_rows,
      // TODO: only display schemas that exist in the db
      dbExtraSearchPath: (config?.db_extra_search_path ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      dbPool: config?.db_pool,
      exposeMode: exposeMode ?? ('schemas' as const),
      tableIdsToAdd: [] as number[],
      tableIdsToRemove: [] as number[],
    }
  }, [config, configDbSchemas, exposeMode])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues,
  })

  const resetForm = useCallback(() => {
    form.reset({ ...defaultValues })
  }, [form, defaultValues])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!projectRef) return console.error('Project ref is required')

    setIsUpdating(true)

    try {
      let dbSchema = values.dbSchema.join(',')

      if (values.exposeMode === 'specific') {
        const exposedSchemas = await updateExposedTables({
          projectRef,
          connectionString: project?.connectionString,
          tableIdsToAdd: values.tableIdsToAdd,
          tableIdsToRemove: values.tableIdsToRemove,
        })

        // graphql_public is managed separately from table-level grants,
        // so preserve its original exposure state when saving in specific mode.
        const hadGraphqlPublic = configDbSchemas.includes('graphql_public')
        const hasGraphqlPublic = exposedSchemas.includes('graphql_public')

        if (hadGraphqlPublic && !hasGraphqlPublic) {
          exposedSchemas.push('graphql_public')
        } else if (!hadGraphqlPublic && hasGraphqlPublic) {
          exposedSchemas.splice(exposedSchemas.indexOf('graphql_public'), 1)
        }

        dbSchema = exposedSchemas.join(',')
      }

      await updatePostgrestConfig(
        {
          projectRef,
          dbSchema,
          maxRows: values.maxRows,
          dbExtraSearchPath: values.dbExtraSearchPath.join(','),
          dbPool: values.dbPool ? values.dbPool : null,
        },
        { onError: noop }
      )

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.exposedTablesInfinite(projectRef),
        }),
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.exposeMode(projectRef),
        }),
      ])

      const updatedExposeMode = queryClient.getQueryData<ExposeMode>(
        privilegeKeys.exposeMode(projectRef)
      )

      toast.success('Successfully saved settings')
      form.reset({
        dbSchema: dbSchema.split(',').map((x) => x.trim()).filter(Boolean),
        maxRows: values.maxRows,
        dbExtraSearchPath: values.dbExtraSearchPath,
        dbPool: values.dbPool,
        exposeMode: updatedExposeMode ?? values.exposeMode,
        tableIdsToAdd: [],
        tableIdsToRemove: [],
      })
    } catch (error) {
      toast.error('Failed to save settings: ' + (error as ResponseError).message || 'Unknown error')
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    const isReady = isApiGrantTogglesEnabled
      ? isSuccessConfig && isSuccessSchemas && isSuccessExposeMode
      : isSuccessConfig && isSuccessSchemas

    if (isReady) {
      resetForm()
    }
  }, [isSuccessConfig, isSuccessSchemas, isSuccessExposeMode, isApiGrantTogglesEnabled, resetForm])

  const watchedExposeMode = form.watch('exposeMode')
  const watchedDbSchema = form.watch('dbSchema')
  const watchedTableIdsToAdd = form.watch('tableIdsToAdd')
  const watchedTableIdsToRemove = form.watch('tableIdsToRemove')
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
              ) : isError || (isApiGrantTogglesEnabled && isExposeModeError) ? (
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
                        <FormItemLayout
                          isReactForm={false}
                          layout="flex-row-reverse"
                          label="Exposed schemas"
                          description="Select schemas to fully expose through the Data API."
                        >
                          <ExposedSchemaSelector
                            selectedSchemas={watchedDbSchema}
                            disabled={!canUpdatePostgrestConfig}
                            onToggleSchema={(schema) => {
                              const current = form.getValues('dbSchema')
                              if (current.includes(schema)) {
                                form.setValue(
                                  'dbSchema',
                                  current.filter((x) => x !== schema),
                                  { shouldDirty: true }
                                )
                              } else {
                                form.setValue('dbSchema', [...current, schema], {
                                  shouldDirty: true,
                                })
                              }
                            }}
                          />
                        </FormItemLayout>
                      ) : (
                        <FormItemLayout
                          isReactForm={false}
                          layout="flex-row-reverse"
                          label="Exposed tables"
                          description="Toggle Data API access for individual tables."
                        >
                          <ExposedTableSelector
                            pendingAddTableIds={watchedTableIdsToAdd}
                            pendingRemoveTableIds={watchedTableIdsToRemove}
                            onTogglePendingAdd={(tableId) => {
                              const current = form.getValues('tableIdsToAdd')
                              if (current.includes(tableId)) {
                                form.setValue(
                                  'tableIdsToAdd',
                                  current.filter((x) => x !== tableId),
                                  { shouldDirty: true }
                                )
                              } else {
                                form.setValue('tableIdsToAdd', [...current, tableId], {
                                  shouldDirty: true,
                                })
                              }
                            }}
                            onTogglePendingRemove={(tableId) => {
                              const current = form.getValues('tableIdsToRemove')
                              if (current.includes(tableId)) {
                                form.setValue(
                                  'tableIdsToRemove',
                                  current.filter((x) => x !== tableId),
                                  { shouldDirty: true }
                                )
                              } else {
                                form.setValue('tableIdsToRemove', [...current, tableId], {
                                  shouldDirty: true,
                                })
                              }
                            }}
                          />
                        </FormItemLayout>
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
