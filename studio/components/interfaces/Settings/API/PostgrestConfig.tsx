import { useContext, FC, useEffect } from 'react'
import { indexOf } from 'lodash'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Input, Form, IconAlertCircle, InputNumber } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore, useProjectPostgrestConfig } from 'hooks'
import { API_URL } from 'lib/constants'
import { patch } from 'lib/common/fetch'
import MultiSelect from 'components/ui/MultiSelect'
import { PageContext } from 'pages/project/[ref]/settings/api'

import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'

interface Props {}

const PostgrestConfig: FC<Props> = ({}) => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const { meta } = PageState

  const router = useRouter()
  const { ref } = router.query

  const formId = 'project-postgres-config'
  const { config, isError, isLoading } = useProjectPostgrestConfig(ref as string | undefined)

  const initialValues = {
    db_schema: '',
    max_rows: '',
    db_extra_search_path: '',
  }

  const canUpdatePostgrestConfig = checkPermissions(
    PermissionAction.UPDATE,
    'custom_config_postgrest'
  )

  const updateConfig = async (updatedConfig: any) => {
    try {
      const response = await patch(`${API_URL}/projects/${ref}/config/postgrest`, updatedConfig)
      if (response.error) {
        throw response.error
      } else {
        ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
      }
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to update config: ${error.message}`,
      })
    }
  }

  const permanentSchema = ['public', 'storage']
  const hiddenSchema = ['auth', 'pgbouncer', 'hooks', 'extensions']
  const schema =
    meta.schemas
      .list(
        (x: any) => {
          const find = indexOf(hiddenSchema, x.name)
          if (find < 0) return x
        },
        { allSchemas: true }
      )
      .map((x: any) => {
        return {
          id: x.id,
          value: x.name,
          name: x.name,
          disabled: indexOf(permanentSchema, x.name) >= 0 ? true : false,
        }
      }) ?? []

  return (
    <Form id={formId} initialValues={initialValues} validate={() => {}} onSubmit={updateConfig}>
      {({ isSubmitting, handleReset, resetForm, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        useEffect(() => {
          if (!isLoading && config) {
            const values = {
              db_schema: config.db_schema,
              max_rows: config.max_rows,
              db_extra_search_path: config.db_extra_search_path ?? '',
            }
            resetForm({ values, initialValues: values })
          }
        }, [isLoading])

        return (
          <>
            <FormPanel
              disabled={true}
              header={<p>API settings</p>}
              footer={
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
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
                <div className="flex items-center justify-center space-x-2 py-8">
                  <IconAlertCircle size={16} strokeWidth={1.5} />
                  <p className="text-sm text-scale-1100">Failed to retrieve API settings</p>
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
                              <div className="mt-2 flex flex-col text-center">
                                <p className="align-center text-sm">
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
