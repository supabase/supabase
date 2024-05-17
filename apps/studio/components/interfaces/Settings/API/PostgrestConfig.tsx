import { PermissionAction } from '@supabase/shared-types/out/constants'
import { indexOf } from 'lodash'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions } from 'hooks'
import { AlertCircle, Info } from 'lucide-react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  Input,
  InputNumber,
} from 'ui'
import { MultiSelectV2 } from 'ui-patterns/MultiSelect/MultiSelectV2'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import Link from 'next/link'

const PostgrestConfig = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()

  const { data: schemas, isLoading: isLoadingSchemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: config, isError } = useProjectPostgrestConfigQuery({ projectRef })

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

  const formId = 'project-postgres-config'
  const initialValues = { db_schema: '', max_rows: '', db_extra_search_path: '', db_pool: '' }

  const updateConfig = async (updatedConfig: typeof initialValues) => {
    if (!projectRef) return console.error('Project ref is required')
    updatePostgrestConfig({
      projectRef,
      dbSchema: updatedConfig.db_schema,
      maxRows: updatedConfig.max_rows,
      dbExtraSearchPath: updatedConfig.db_extra_search_path,
      dbPool: updatedConfig.db_pool || null,
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

  return (
    <Form id={formId} initialValues={initialValues} validate={() => {}} onSubmit={updateConfig}>
      {({ handleReset, resetForm, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
        // [Alaister] although this "technically" is breaking the rules of React hooks
        // it won't error because the hooks are always rendered in the same order
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (config) {
            const values = {
              db_schema: config.db_schema,
              max_rows: config.max_rows,
              db_extra_search_path: config.db_extra_search_path ?? '',
              db_pool: config.db_pool || null,
            }

            resetForm({ values, initialValues: values })
          }
        }, [config])

        return (
          <>
            <FormPanel
              disabled={true}
              header={<p>API settings</p>}
              footer={
                <div className="flex px-8 py-4">
                  <FormActions
                    form={formId}
                    isSubmitting={isUpdating}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
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
                <div className="flex items-center justify-center py-8 space-x-2">
                  <AlertCircle size={16} strokeWidth={1.5} />
                  <p className="text-sm text-foreground-light">Failed to retrieve API settings</p>
                </div>
              ) : (
                <>
                  <FormSection header={<FormSectionLabel>Exposed schemas</FormSectionLabel>}>
                    {isLoadingSchemas ? (
                      <div className="col-span-12 flex flex-col gap-2 lg:col-span-7">
                        <ShimmeringLoader />
                        <ShimmeringLoader className="w-3/4" />
                      </div>
                    ) : (
                      <FormSectionContent loading={false}>
                        {schema.length >= 1 && (
                          <div className="grid gap-2">
                            <MultiSelectV2
                              options={schema}
                              disabled={!canUpdatePostgrestConfig}
                              value={
                                values?.db_schema
                                  ? values.db_schema.replace(/ /g, '').split(',')
                                  : []
                              }
                              placeholder="Choose a schema to expose"
                              searchPlaceholder="Search for a schema"
                              onChange={(event) => {
                                let updatedValues: any = values
                                updatedValues.db_schema = event.join(', ')
                                resetForm({ values: updatedValues, initialValues: updatedValues })
                                updateConfig({ ...updatedValues })
                              }}
                            />
                            <p className="text-foreground-lighter text-sm">
                              The schemas to expose in your API. Tables, views and stored procedures
                              in these schemas will get API endpoints.
                            </p>

                            {!isPublicSchemaEnabled && (
                              <Alert_Shadcn_ variant="default">
                                <Info className="h-4 w-4" />
                                <AlertTitle_Shadcn_>
                                  The public schema for this project is not exposed
                                </AlertTitle_Shadcn_>
                                <AlertDescription_Shadcn_>
                                  <p>
                                    You will not be able to query tables and views in the{' '}
                                    <code>public</code> schema via supabase-js or HTTP clients.
                                  </p>
                                  {isGraphqlExtensionEnabled && (
                                    <div className="grid gap-3 mt-2">
                                      <div>
                                        Tables in the <code>public</code> schema are still exposed
                                        over our GraphQL endpoints.
                                      </div>
                                      <p>
                                        <Button asChild type="default">
                                          <Link
                                            href={`/project/${projectRef}/database/extensions`}
                                            className="!no-underline !hover:bg-surface-100 !text-foreground"
                                          >
                                            Disable the pg_graphql extension
                                          </Link>
                                        </Button>
                                      </p>
                                    </div>
                                  )}
                                </AlertDescription_Shadcn_>
                              </Alert_Shadcn_>
                            )}
                          </div>
                        )}
                      </FormSectionContent>
                    )}
                  </FormSection>

                  <FormSection header={<FormSectionLabel>Extra search path</FormSectionLabel>}>
                    <FormSectionContent loading={false}>
                      <Input
                        id="db_extra_search_path"
                        size="small"
                        disabled={!canUpdatePostgrestConfig}
                        descriptionText="Extra schemas to add to the search path of every request. Multiple schemas must be comma-separated."
                      />
                    </FormSectionContent>
                  </FormSection>
                  <FormSection header={<FormSectionLabel>Max rows</FormSectionLabel>}>
                    <FormSectionContent loading={false}>
                      <InputNumber
                        id="max_rows"
                        size="small"
                        disabled={!canUpdatePostgrestConfig}
                        descriptionText="The maximum number of rows returned from a view, table, or stored procedure. Limits payload size for accidental or malicious requests."
                      />
                    </FormSectionContent>
                  </FormSection>
                  <FormSection header={<FormSectionLabel>Pool size</FormSectionLabel>}>
                    <FormSectionContent loading={false}>
                      <InputNumber
                        id="db_pool"
                        size="small"
                        disabled={!canUpdatePostgrestConfig}
                        descriptionText="Number of maximum connections to keep open in the Data API server's database pool. Unset to let it be configured automatically based on compute size."
                        placeholder="Configured automatically based on compute size"
                      />
                    </FormSectionContent>
                  </FormSection>
                </>
              )}
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default PostgrestConfig
