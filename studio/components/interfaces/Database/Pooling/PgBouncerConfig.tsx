import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Typography } from '@supabase/ui'
import Divider from 'components/ui/Divider'
import { AutoField } from 'uniforms-bootstrap4'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { patch } from 'lib/common/fetch'
import ToggleField from 'components/to-be-cleaned/forms/ToggleField'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'

interface Props {
  projectRef: string
  config: any
}

const PgbouncerConfig: FC<Props> = ({ projectRef, config }) => {
  const { ui } = useStore()

  const [updates, setUpdates] = useState<any>({
    // pgbouncer_status: config.pgbouncer_status,
    pgbouncer_enabled: config.pgbouncer_enabled,
    pool_mode: config.pool_mode || 'transaction',
    default_pool_size: config.default_pool_size || '',
    ignore_startup_parameters: config.ignore_startup_parameters || '',
  })

  const updateConfig = async (updatedConfig: any) => {
    try {
      const response = await patch(`${API_URL}/props/pooling/${projectRef}/config`, updatedConfig)
      if (response.error) {
        throw response.error
      } else {
        setUpdates({ ...response.project })
        ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update config: ${error.message}`,
      })
    }
  }

  const formSchema = {
    properties: {
      pgbouncer_enabled: {
        title: 'Enabled',
        type: 'boolean',
        help: 'Activates/ deactivates Connection Pooling.',
      },
      pool_mode: {
        title: 'Pool Mode',
        type: 'string',
        options: [
          {
            label: 'Transaction',
            value: 'transaction',
          },
          {
            label: 'Session',
            value: 'session',
          },
          {
            label: 'Statement',
            value: 'statement',
          },
        ],
      },
      ignore_startup_parameters: {
        title: 'Ignore Startup Parameters',
        type: 'string',
        readOnly: true,
        help: 'Defaults are either blank or "extra_float_digits"',
      },
    },
    required: ['pool_mode'],
    type: 'object',
  }

  return (
    <>
      <SchemaFormPanel
        title="Configuration"
        schema={formSchema}
        model={updates}
        submitLabel="Save"
        cancelLabel="Cancel"
        onChangeModel={(model: any) => setUpdates(model)}
        onSubmit={(model: any) => updateConfig(model)}
        onReset={() => setUpdates(config)}
      >
        <div className="space-y-6 py-4">
          <ToggleField name="pgbouncer_enabled" />
          <Divider light />
          {/* <AutoField name="pgbouncer_status" disabled={true} /> */}
          {updates.pgbouncer_enabled && (
            <>
              <AutoField
                name="pool_mode"
                showInlineError
                errorMessage="You must select one of the three options"
              />
              <div className="flex !mt-1" style={{ marginLeft: 'calc(33% + 0.5rem)' }}>
                <p className="text-sm text-scale-900">
                  Specify when a connection can be returned to the pool. To find out the most
                  suitable mode for your use case,{' '}
                  <a
                    className="text-green-900"
                    target="_blank"
                    href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool"
                  >
                    click here
                  </a>
                  .
                </p>
              </div>
              <Divider light />
              {/* <AutoField
                name="default_pool_size"
                showInlineError
                errorMessage="Value must be within 1 and 20"
              /> */}
              <AutoField name="ignore_startup_parameters" />
            </>
          )}
        </div>
      </SchemaFormPanel>
    </>
  )
}

export default observer(PgbouncerConfig)
