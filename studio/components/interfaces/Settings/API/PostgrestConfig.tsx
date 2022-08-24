import { useContext, useState } from 'react'
import { indexOf } from 'lodash'
import { AutoField } from 'uniforms-bootstrap4'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle } from '@supabase/ui'

import { checkPermissions, useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { patch } from 'lib/common/fetch'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import MultiSelect from 'components/ui/MultiSelect'
import { PageContext } from 'pages/project/[ref]/settings/api'
import { PermissionAction } from '@supabase/shared-types/out/constants'

// [Joshen TODO] Refactor to use supabase form component and FormPanel component

const PostgrestConfig = observer(({ config, projectRef }: any) => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const { meta } = PageState

  const [updates, setUpdates] = useState({
    db_schema: config.db_schema,
    max_rows: config.max_rows,
    db_extra_search_path: config.db_extra_search_path || '',
  })

  const canUpdatePostgrestConfig = checkPermissions(
    PermissionAction.UPDATE,
    'custom_config_postgrest'
  )

  const updateConfig = async (updatedConfig: any) => {
    try {
      const response = await patch(
        `${API_URL}/projects/${projectRef}/config/postgrest`,
        updatedConfig
      )
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

  // manually filter out following schema
  const hiddenSchema = ['auth', 'pgbouncer', 'hooks', 'extensions']
  // following schema is permament
  const permanentSchema = ['public', 'storage']
  // construct list of schema for input controller
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
    <>
      <SchemaFormPanel
        title="Settings"
        schema={{
          properties: {
            db_schema: {
              title: 'Schema',
              type: 'string',
              help: 'The schema to expose in your API. Tables, views and stored procedures in this schema will get API endpoints. Multiple schemas must be comma-separated.',
            },
            max_rows: {
              title: 'Max Rows',
              type: 'integer',
              help: 'The maximum number of rows returns from a view, table, or stored procedure. Limits payload size for accidental or malicious requests.',
            },
            db_extra_search_path: {
              title: 'Extra search path',
              type: 'string',
              help: 'Extra schemas to add to the search_path of every request. Multiple schemas must be comma-separated.',
            },
          },
          required: ['max_rows'],
          type: 'object',
        }}
        model={updates}
        message={
          !canUpdatePostgrestConfig
            ? "You need additional permissions to update your project's API settings"
            : undefined
        }
        onSubmit={(model: any) => updateConfig(model)}
        onReset={() => setUpdates(config)}
      >
        <div className="space-y-6 py-4">
          {schema.length >= 1 && (
            <MultiSelect
              disabled={!canUpdatePostgrestConfig}
              options={schema}
              // value must be passed as array of strings
              value={updates.db_schema.replace(/ /g, '').split(',')}
              // onChange returns array of strings
              onChange={(event) => {
                let payload = updates
                payload.db_schema = event.join(', ') // permanentSchema.concat(event).join(', ')
                setUpdates({ ...payload })
                updateConfig({ ...payload })
              }}
              label={'Schema'}
              descriptionText={
                <>
                  The schema to expose in your API. Tables, views and stored procedures in this
                  schema will get API endpoints.<code>public</code> and <code>storage</code> are
                  protected by default.
                </>
              }
              emptyMessage={
                <>
                  <IconAlertCircle strokeWidth={2} />
                  <div className="mt-2 flex flex-col text-center">
                    <p className="text-sm align-center">No schema available to choose</p>
                    <p className="text-xs opacity-50">New schemas you create will appear here</p>
                  </div>
                </>
              }
            />
          )}
          <AutoField
            disabled={!canUpdatePostgrestConfig}
            name="db_extra_search_path"
            showInlineError
            errorMessage="Must be a string."
            className={`${!canUpdatePostgrestConfig ? 'opacity-50' : ''}`}
          />
          <AutoField
            disabled={!canUpdatePostgrestConfig}
            name="max_rows"
            showInlineError
            errorMessage="Must be a number."
            className={`${!canUpdatePostgrestConfig ? 'opacity-50' : ''}`}
          />
        </div>
      </SchemaFormPanel>
    </>
  )
})

export default PostgrestConfig
