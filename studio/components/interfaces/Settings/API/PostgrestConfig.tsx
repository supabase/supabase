import { PermissionAction } from '@supabase/shared-types/out/constants'
import { indexOf } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import MultiSelect from 'components/ui/MultiSelect'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions, useStore } from 'hooks'
import { Form, IconAlertCircle, Input, InputNumber } from 'ui'

const PostgrestConfig = () => {
  const { ref: projectRef } = useParams()
  const { ui } = useStore()

  const { project } = useProjectContext()
  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: config, isError } = useProjectPostgrestConfigQuery({ projectRef })
  const { mutate: updatePostgrestConfig, isLoading: isUpdating } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: () => {
        ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
      },
    })
  const canUpdatePostgrestConfig = useCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_postgrest'
  )

  const formId = 'project-postgres-config'
  const initialValues = { db_schema: '', max_rows: '', db_extra_search_path: '' }

  const updateConfig = async (updatedConfig: typeof initialValues) => {
    if (!projectRef) return console.error('Project ref is required')
    updatePostgrestConfig({
      projectRef,
      dbSchema: updatedConfig.db_schema,
      maxRows: updatedConfig.max_rows,
      dbExtraSearchPath: updatedConfig.db_extra_search_path,
    })
  }

  const permanentSchema = ['public', 'storage']
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
          disabled: indexOf(permanentSchema, x.name) >= 0 ? true : false,
        }
      }) ?? []

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
                  <IconAlertCircle size={16} strokeWidth={1.5} />
                  <p className="text-sm text-foreground-light">Failed to retrieve API settings</p>
                </div>
              ) : (
                <>
                  <FormSection header={<FormSectionLabel>Exposed schemas</FormSectionLabel>}>
                    <FormSectionContent loading={false}>
                      {schema.length >= 1 && (
                        <MultiSelect
                          disabled={!canUpdatePostgrestConfig}
                          options={schema}
                          descriptionText={
                            <>
                              The schemas to expose in your API. Tables, views and stored procedures
                              in these schemas will get API endpoints.
                              <code className="text-xs">public</code> and{' '}
                              <code className="text-xs">storage</code> are protected by default.
                            </>
                          }
                          emptyMessage={
                            <>
                              <IconAlertCircle strokeWidth={2} />
                              <div className="flex flex-col mt-2 text-center">
                                <p className="text-sm align-center">
                                  No schema available to choose
                                </p>
                                <p className="text-xs opacity-50">
                                  New schemas you create will appear here
                                </p>
                              </div>
                            </>
                          }
                          // value must be passed as array of strings
                          value={(values?.db_schema ?? '').replace(/ /g, '').split(',')}
                          // onChange returns array of strings
                          onChange={(event) => {
                            let updatedValues: any = values
                            updatedValues.db_schema = event.join(', ')
                            resetForm({ values: updatedValues, initialValues: updatedValues })
                            updateConfig({ ...updatedValues })
                          }}
                        />
                      )}
                    </FormSectionContent>
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
                </>
              )}
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default observer(PostgrestConfig)
