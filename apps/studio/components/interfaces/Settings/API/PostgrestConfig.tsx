import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormActions, FormPanel } from 'components/ui/Forms'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions } from 'hooks'
import { indexOf } from 'lodash'
import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  Admonition,
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Skeleton,
  Switch,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { z } from 'zod'

const formSchema = z
  .object({
    dbSchema: z.array(z.string()),
    dbExtraSearchPath: z.string(),
    maxRows: z.number().max(1000000, "Can't be more than 1,000,000"),
    dbPool: z
      .number()
      .min(0, 'Must be more than 0')
      .max(1000, "Can't be more than 1000")
      .optional()
      .nullable(),
    enableDataApi: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.enableDataApi && data.dbSchema.length === 0) {
        return false
      }
      return true
    },
    {
      message: 'Must have at least one schema if Data API is enabled',
      path: ['dbSchema'],
    }
  )

const PostgrestConfig = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()

  const { data: schemas, isLoading: isLoadingSchemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: config,
    isLoading: isLoadingPostgrestConfigQuery,
    isError,
  } = useProjectPostgrestConfigQuery({ projectRef })

  console.log('config', config)

  const { mutate: updatePostgrestConfig, isLoading: isUpdating } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully saved settings')
      },
    })

  const canUpdatePostgrestConfig = useCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_postgrest'
  )

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      dbSchema: config?.db_schema ? config?.db_schema.replace(/ /g, '').split(',') : [],
      maxRows: config?.max_rows,
      dbExtraSearchPath: config?.db_extra_search_path,
      dbPool: config?.db_pool,
    },
  })

  const formId = 'project-postgres-config'

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!projectRef) return console.error('Project ref is required') // is this needed ?

    updatePostgrestConfig({
      projectRef,
      dbSchema: values.dbSchema.join(', '),
      maxRows: values.maxRows,
      dbExtraSearchPath: values.dbExtraSearchPath,
      dbPool: values.dbPool ? values.dbPool : null,
    })
  }

  const hiddenSchema = ['auth', 'pgbouncer', 'hooks', 'extensions']
  const schema =
    schemas
      ?.filter((x) => {
        const find = indexOf(hiddenSchema, x.name)
        if (find < 0) return x
      })
      .map((x) => {
        return {
          id: x.id,
          value: x.name,
          name: x.name,
          disabled: false,
        }
      }) ?? []

  const isPublicSchemaEnabled = config?.db_schema
    .split(',')
    .map((name) => name.trim())
    .includes('public')

  const isGraphqlExtensionEnabled =
    (extensions ?? []).find((ext) => ext.name === 'pg_graphql')?.installed_version !== null

  console.log('schema', schema)
  console.log('default values', form.getValues())
  console.log('config', config)

  function resetForm(enableDataApi = false) {
    if (config) {
      form.reset({
        dbSchema: config.db_schema ? config.db_schema.replace(/ /g, '').split(',') : [],
        maxRows: config.max_rows,
        dbExtraSearchPath: config.db_extra_search_path,
        dbPool: config.db_pool,
        enableDataApi: enableDataApi,
      })
    }
  }

  useEffect(() => {
    if (schema && config) {
      const enableDataApi = config.db_schema ? true : false
      resetForm(enableDataApi)
    }
  }, [schema && config])

  const isDataApiEnabledInForm = form.getValues('enableDataApi')

  return (
    <Form_Shadcn_ {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
        <FormPanel
          disabled={true}
          header={<p>Data API Settings</p>}
          footer={
            <div className="flex px-8 py-4">
              <FormActions
                form={formId}
                isSubmitting={isUpdating}
                hasChanges={form.formState.isDirty}
                handleReset={resetForm}
                disabled={!canUpdatePostgrestConfig}
                helper={
                  !canUpdatePostgrestConfig
                    ? "You need additional permissions to update your project's API settings"
                    : undefined
                }
              />
            </div>
          }
        >
          {isError ? (
            <Admonition type="destructive" title="Failed to retrieve API settings" />
          ) : (
            <>
              <FormField_Shadcn_
                control={form.control}
                name="enableDataApi"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full">
                    <FormItemLayout
                      className="w-full px-8 py-8"
                      layout="flex"
                      label="Enable Data API"
                      description="When enabled you will be able to use any Supabase client library and PostgREST endpoints with any schema configured below."
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          size="large"
                          checked={field.value}
                          onCheckedChange={(value) => {
                            field.onChange(value)

                            if (!value) {
                              /**
                               * reset the form to default values
                               */
                              resetForm(false)
                              /**
                               * remove all the schema values when disabling the Data API
                               */
                              form.setValue('dbSchema', [])
                            } else {
                              /**
                               * reset the form to default values
                               * when disabled the Data API
                               */
                              resetForm(true)
                            }
                          }}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                    {isGraphqlExtensionEnabled && field.value == false && (
                      <div className="px-8 mb-6">
                        <Admonition
                          type="warning"
                          title="Tables could still be exposed via GraphQl"
                          className=""
                        >
                          <>
                            <p>
                              Tables in the <code className="text-xs">public</code> schema are still
                              exposed over our GraphQL endpoints.
                            </p>
                            <Button asChild type="default">
                              <Link
                                href={`/project/${projectRef}/database/extensions`}
                                // className="!no-underline !hover:bg-surface-100 !text-foreground"
                              >
                                Disable the pg_graphql extension
                              </Link>
                            </Button>
                          </>
                        </Admonition>
                      </div>
                    )}
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="dbSchema"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full">
                    <FormItemLayout
                      label="Exposed schemas"
                      description="The schemas to expose in your API. Tables, views and stored procedures in
                          these schemas will get API endpoints."
                      layout="horizontal"
                      className="px-8 py-8"
                    >
                      {isLoadingSchemas ? (
                        <div className="col-span-12 flex flex-col gap-2 lg:col-span-7">
                          <Skeleton className="w-full h-[38px]" />
                        </div>
                      ) : (
                        <MultiSelector
                          onValuesChange={field.onChange}
                          values={field.value}
                          size={'small'}
                          disabled={!canUpdatePostgrestConfig || !isDataApiEnabledInForm}
                        >
                          <MultiSelectorTrigger>
                            <MultiSelectorInput placeholder="Select schemas for Data API..." />
                          </MultiSelectorTrigger>
                          <MultiSelectorContent>
                            {schema.length <= 0 ? (
                              <MultiSelectorList>
                                <MultiSelectorItem key={'empty'} value={'no'}>
                                  no
                                </MultiSelectorItem>
                              </MultiSelectorList>
                            ) : (
                              <MultiSelectorList>
                                {schema.map((x, i) => (
                                  <MultiSelectorItem key={x.id + '-' + i} value={x.name}>
                                    {x.name}
                                  </MultiSelectorItem>
                                ))}
                              </MultiSelectorList>
                            )}
                          </MultiSelectorContent>
                        </MultiSelector>
                      )}

                      {!field.value.includes('public') &&
                        form.getValues('enableDataApi') !== false &&
                        field.value.length > 0 && (
                          <Admonition
                            type="default"
                            title="The public schema for this project is not exposed"
                            className="mt-2"
                          >
                            <>
                              <p>
                                You will not be able to query tables and views in the{' '}
                                <code>public</code> schema via supabase-js or HTTP clients.
                              </p>
                              {isGraphqlExtensionEnabled && (
                                <>
                                  <p>
                                    Tables in the <code className="text-xs">public</code> schema are
                                    still exposed over our GraphQL endpoints.
                                  </p>
                                  <Button asChild type="default">
                                    <Link
                                      href={`/project/${projectRef}/database/extensions`}
                                      // className="!no-underline !hover:bg-surface-100 !text-foreground"
                                    >
                                      Disable the pg_graphql extension
                                    </Link>
                                  </Button>
                                </>
                              )}
                            </>
                          </Admonition>
                        )}
                    </FormItemLayout>
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="dbExtraSearchPath"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full">
                    <FormItemLayout
                      className="w-full px-8 py-8"
                      layout="horizontal"
                      label="Extra search path"
                      description="Extra schemas to add to the search path of every request. Multiple schemas must be comma-separated."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          size="small"
                          disabled={!canUpdatePostgrestConfig || !isDataApiEnabledInForm}
                          {...field}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="maxRows"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full">
                    <FormItemLayout
                      className="w-full px-8 py-8"
                      layout="horizontal"
                      label="Max rows"
                      description="The maximum number of rows returned from a view, table, or stored procedure. Limits payload size for accidental or malicious requests."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          size="small"
                          disabled={!canUpdatePostgrestConfig || !isDataApiEnabledInForm}
                          {...field}
                          type="number"
                          {...form.register('maxRows', {
                            valueAsNumber: true, // Ensure the value is handled as a number
                          })}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  </FormItem_Shadcn_>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="dbPool"
                render={({ field }) => (
                  <FormItem_Shadcn_ className="w-full">
                    <FormItemLayout
                      className="w-full px-8 py-8"
                      layout="horizontal"
                      label="Pool size"
                      description="Number of maximum connections to keep open in the Data API server's database pool. Unset to let it be configured automatically based on compute size."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          size="small"
                          disabled={!canUpdatePostgrestConfig || !isDataApiEnabledInForm}
                          {...field}
                          type="number"
                          placeholder="Configured automatically based on compute size"
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : Number(e.target.value))
                          }
                          value={field.value === null ? '' : field.value}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  </FormItem_Shadcn_>
                )}
              />
            </>
          )}
        </FormPanel>
      </form>
    </Form_Shadcn_>
  )
}

export default PostgrestConfig
