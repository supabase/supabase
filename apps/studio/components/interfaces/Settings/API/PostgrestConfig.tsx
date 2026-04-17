import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
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
  FormInputGroupInput,
  FormItem_Shadcn_,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Skeleton,
  Switch,
  useWatch_Shadcn_,
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
import { ExposedFunctionSelector } from '@/components/interfaces/Settings/API/ExposedFunctionSelector'
import { ExposedTableSelector } from '@/components/interfaces/Settings/API/ExposedTableSelector'
import { FormActions } from '@/components/ui/Forms/FormActions'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from '@/data/config/project-postgrest-config-update-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { defaultPrivilegesQueryOptions } from '@/data/privileges/default-privileges-query'
import { privilegeKeys } from '@/data/privileges/keys'
import { useUpdateDefaultPrivilegesMutation } from '@/data/privileges/update-default-privileges-mutation'
import { useUpdateExposedEntitiesMutation } from '@/data/privileges/update-exposed-entities-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useDataApiGrantTogglesEnabled } from '@/hooks/misc/useDataApiGrantTogglesEnabled'
import useLatest from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'
import { IS_PLATFORM } from '@/lib/constants'
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

  // Default privileges toggle
  defaultPrivilegesGranted: z.boolean(),

  // Fields for expose toggles
  tableIdsToAdd: z.array(z.number()),
  tableIdsToRemove: z.array(z.number()),
  functionNamesToAdd: z.array(z.string()),
  functionNamesToRemove: z.array(z.string()),
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

  const {
    data: defaultPrivilegesGranted,
    isPending: isLoadingDefaultPrivileges,
    isSuccess: isSuccessDefaultPrivileges,
  } = useQuery(
    defaultPrivilegesQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })
  )

  const configDbSchemas = useMemo(
    () => (config?.db_schema ? config.db_schema.split(',').map((x) => x.trim()) : []),
    [config?.db_schema]
  )

  const isLoading = isLoadingConfig || isLoadingSchemas || isLoadingDefaultPrivileges

  const schemas = useMemo(
    () =>
      allSchemas
        .filter((x) => {
          if (x.name === 'graphql_public') return true
          return !INTERNAL_SCHEMAS.includes(x.name)
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

  const { mutateAsync: updatePostgrestConfig } = useProjectPostgrestConfigUpdateMutation({
    onError: noop,
  })
  const { mutateAsync: updateExposedEntities } = useUpdateExposedEntitiesMutation({ onError: noop })
  const { mutateAsync: updateDefaultPrivileges } = useUpdateDefaultPrivilegesMutation({
    onError: noop,
  })

  const [isUpdating, setIsUpdating] = useState(false)

  const formId = 'project-postgres-config'

  const { can: canUpdatePostgrestConfigPermission, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.UPDATE, 'custom_config_postgrest')
  const canUpdatePostgrestConfig = IS_PLATFORM && canUpdatePostgrestConfigPermission

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
      defaultPrivilegesGranted: defaultPrivilegesGranted ?? true,
      tableIdsToAdd: [] as number[],
      tableIdsToRemove: [] as number[],
      functionNamesToAdd: [] as string[],
      functionNamesToRemove: [] as string[],
    }
  }, [config, configDbSchemas, defaultPrivilegesGranted])

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

      if (isApiGrantTogglesEnabled) {
        await updateExposedEntities({
          projectRef,
          connectionString: project?.connectionString,
          tableIdsToAdd: values.tableIdsToAdd,
          tableIdsToRemove: values.tableIdsToRemove,
          functionNamesToAdd: values.functionNamesToAdd,
          functionNamesToRemove: values.functionNamesToRemove,
        })

        if (values.defaultPrivilegesGranted !== defaultPrivilegesGranted) {
          await updateDefaultPrivileges({
            projectRef,
            connectionString: project?.connectionString,
            granted: values.defaultPrivilegesGranted,
          })
        }
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
          queryKey: privilegeKeys.exposedTableCounts(projectRef),
        }),
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.exposedFunctionsInfinite(projectRef),
        }),
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.exposedFunctionCounts(projectRef),
        }),
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.defaultPrivileges(projectRef),
        }),
      ])

      toast.success('Successfully saved settings')
      form.reset({
        dbSchema: dbSchema
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        maxRows: values.maxRows,
        dbExtraSearchPath: values.dbExtraSearchPath,
        dbPool: values.dbPool,
        defaultPrivilegesGranted: values.defaultPrivilegesGranted,
        tableIdsToAdd: [],
        tableIdsToRemove: [],
        functionNamesToAdd: [],
        functionNamesToRemove: [],
      })
    } catch (error) {
      toast.error('Failed to save settings: ' + (error as ResponseError).message || 'Unknown error')
    } finally {
      setIsUpdating(false)
    }
  }

  const resetFormRef = useLatest(resetForm)
  const isReady = isSuccessConfig && isSuccessSchemas && isSuccessDefaultPrivileges
  useEffect(() => {
    if (isReady) {
      resetFormRef.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  const watchedDbSchema = useWatch_Shadcn_({ control: form.control, name: 'dbSchema' })
  const watchedTableIdsToAdd = useWatch_Shadcn_({ control: form.control, name: 'tableIdsToAdd' })
  const watchedTableIdsToRemove = useWatch_Shadcn_({
    control: form.control,
    name: 'tableIdsToRemove',
  })
  const watchedFunctionNamesToAdd = useWatch_Shadcn_({
    control: form.control,
    name: 'functionNamesToAdd',
  })
  const watchedFunctionNamesToRemove = useWatch_Shadcn_({
    control: form.control,
    name: 'functionNamesToRemove',
  })

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
                    <CardContent className="space-y-6">
                      <FormItemLayout
                        isReactForm={false}
                        layout="flex-row-reverse"
                        label="Exposed schemas"
                        description="Select schemas to include in the Data API. Schemas must be included before tables can be exposed."
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

                      <FormItemLayout
                        isReactForm={false}
                        layout="flex-row-reverse"
                        label="Exposed tables"
                        description="Toggle Data API access for individual tables."
                      >
                        <ExposedTableSelector
                          selectedSchemas={watchedDbSchema}
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

                      <FormItemLayout
                        isReactForm={false}
                        layout="flex-row-reverse"
                        label="Exposed functions"
                        description="Toggle Data API access for individual functions."
                      >
                        <ExposedFunctionSelector
                          selectedSchemas={watchedDbSchema}
                          pendingAddFunctionNames={watchedFunctionNamesToAdd}
                          pendingRemoveFunctionNames={watchedFunctionNamesToRemove}
                          onTogglePendingAdd={(functionName) => {
                            const current = form.getValues('functionNamesToAdd')
                            if (current.includes(functionName)) {
                              form.setValue(
                                'functionNamesToAdd',
                                current.filter((x) => x !== functionName),
                                { shouldDirty: true }
                              )
                            } else {
                              form.setValue('functionNamesToAdd', [...current, functionName], {
                                shouldDirty: true,
                              })
                            }
                          }}
                          onTogglePendingRemove={(functionName) => {
                            const current = form.getValues('functionNamesToRemove')
                            if (current.includes(functionName)) {
                              form.setValue(
                                'functionNamesToRemove',
                                current.filter((x) => x !== functionName),
                                { shouldDirty: true }
                              )
                            } else {
                              form.setValue('functionNamesToRemove', [...current, functionName], {
                                shouldDirty: true,
                              })
                            }
                          }}
                        />
                      </FormItemLayout>

                      {watchedDbSchema.includes('public') && (
                        <FormField_Shadcn_
                          control={form.control}
                          name="defaultPrivilegesGranted"
                          render={({ field }) => (
                            <FormItem_Shadcn_>
                              <FormItemLayout
                                layout="flex-row-reverse"
                                label="Default privileges for new entities"
                                description={
                                  <>
                                    When enabled, new tables and functions in the{' '}
                                    <code>public</code> schema are automatically accessible via the
                                    Data API. We recommend disabling this and manually granting
                                    access to each new entity.
                                  </>
                                }
                              >
                                <FormControl_Shadcn_>
                                  <div>
                                    <Switch
                                      size="large"
                                      disabled={!canUpdatePostgrestConfig}
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </div>
                                </FormControl_Shadcn_>
                              </FormItemLayout>
                            </FormItem_Shadcn_>
                          )}
                        />
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
                              <InputGroup>
                                <FormInputGroupInput
                                  size="small"
                                  disabled={!canUpdatePostgrestConfig}
                                  {...field}
                                  type="number"
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                                <InputGroupAddon align="inline-end">
                                  <InputGroupText>rows</InputGroupText>
                                </InputGroupAddon>
                              </InputGroup>
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
                              <InputGroup>
                                <FormInputGroupInput
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
                                <InputGroupAddon align="inline-end">
                                  <InputGroupText>connections</InputGroupText>
                                </InputGroupAddon>
                              </InputGroup>
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
          {IS_PLATFORM && (
            <CardFooter className="border-t">
              <FormActions
                form={formId}
                isSubmitting={isUpdating}
                hasChanges={form.formState.isDirty}
                handleReset={resetForm}
                disabled={!canUpdatePostgrestConfig}
                helper={
                  isPermissionsLoaded && !canUpdatePostgrestConfigPermission
                    ? "You need additional permissions to update your project's API settings"
                    : undefined
                }
              />
            </CardFooter>
          )}
        </Card>
        {IS_PLATFORM && (
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
        )}
      </PageSectionContent>

      {IS_PLATFORM && <HardenAPIModal visible={showModal} onClose={() => setShowModal(false)} />}
    </PageSection>
  )
}
