import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Fragment, useState } from 'react'
import { Input } from 'ui'
import { AutoField } from 'uniforms-bootstrap4'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import AlertError from 'components/ui/AlertError'
import Divider from 'components/ui/Divider'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { usePoolingConfigurationUpdateMutation } from 'data/database/pooling-configuration-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { pluckObjectFields } from 'lib/helpers'

const ConnectionPooling = () => {
  const { project } = useProjectContext()
  const projectRef = project?.ref ?? 'default'
  const {
    data: poolingConfiguration,
    error,
    isLoading,
    isError,
    isSuccess,
  } = usePoolingConfigurationQuery({ projectRef })

  const formModel = poolingConfiguration
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const connectionInfo = isSuccess ? pluckObjectFields(formModel, DB_FIELDS) : {}
  const BOUNCER_FIELDS = [
    'default_pool_size',
    'ignore_startup_parameters',
    'pool_mode',
    'pgbouncer_enabled',
    'supavisor_enabled',
    'max_client_conn',
    'connectionString',
  ]
  const bouncerInfo = isSuccess ? pluckObjectFields(formModel, BOUNCER_FIELDS) : {}

  return (
    <>
      {isLoading && (
        <Panel
          title={
            <h5 key="panel-title" className="mb-0">
              Connection Pooling
            </h5>
          }
        >
          <Panel.Content className="space-y-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Fragment key={i}>
                <div className="grid gap-2 items-center md:grid md:grid-cols-12 md:gap-x-4 w-full">
                  <ShimmeringLoader className="h-4 w-1/3 col-span-4" delayIndex={i} />
                  <ShimmeringLoader className="h-8 w-full col-span-8" delayIndex={i} />
                </div>
                <Divider light />
              </Fragment>
            ))}

            <ShimmeringLoader className="h-8 w-full" />
          </Panel.Content>
        </Panel>
      )}
      {isError && (
        <div className="p-4">
          <AlertError error={error} subject="Failed to retrieve pooling configuration" />
        </div>
      )}
      {isSuccess && (
        <>
          {!poolingConfiguration?.pgbouncer_enabled && poolingConfiguration?.pool_mode === null ? (
            <Panel
              title={
                <h5 key="panel-title" className="mb-0">
                  Connection Pooling is not available for this project
                </h5>
              }
            >
              <Panel.Content>
                <p className="text-foreground-light">
                  Please start a new project to enable this feature.
                </p>
              </Panel.Content>
            </Panel>
          ) : (
            <PgbouncerConfig
              projectRef={projectRef}
              bouncerInfo={bouncerInfo}
              connectionInfo={connectionInfo}
            />
          )}
        </>
      )}
    </>
  )
}

export default ConnectionPooling

interface ConfigProps {
  projectRef: string
  bouncerInfo: {
    default_pool_size: number
    ignore_startup_parameters: 'string'
    pool_mode: string
    pgbouncer_enabled: boolean
    max_client_conn: number
    connectionString: string
    supavisor_enabled: boolean
  }
  connectionInfo: {
    db_host: string
    db_name: string
    db_port: number
    db_user: string
    inserted_at: string
  }
}

export const PgbouncerConfig = ({ projectRef, bouncerInfo, connectionInfo }: ConfigProps) => {
  const { ui } = useStore()
  const { project } = useProjectContext()
  const [updates, setUpdates] = useState({
    pool_mode: bouncerInfo.pool_mode || 'transaction',
    default_pool_size: bouncerInfo.default_pool_size || undefined,
    ignore_startup_parameters: bouncerInfo.ignore_startup_parameters || '',
    pgbouncer_enabled: bouncerInfo.pgbouncer_enabled,
    max_client_conn: bouncerInfo.max_client_conn || undefined,
  })

  const { mutateAsync: updateConfiguration, isLoading: isUpdating } =
    usePoolingConfigurationUpdateMutation({
      onSuccess: (res) => {
        setUpdates({ ...(res as any) })
        ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
      },
    })

  const canUpdateConnectionPoolingConfiguration = useCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const updateConfig = async (updatedConfig: any) => {
    try {
      await updateConfiguration({
        ref: projectRef,
        pgbouncer_enabled: updatedConfig.pgbouncer_enabled,
        default_pool_size: updatedConfig.default_pool_size,
        ignore_startup_parameters: updatedConfig.ignore_startup_parameters,
        pool_mode: updatedConfig.pool_mode,
        max_client_conn: updatedConfig.max_client_conn,
      })
    } finally {
    }
  }

  const formSchema = {
    properties: {
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
        ],
      },
      ignore_startup_parameters: {
        title: 'Ignore Startup Parameters',
        type: 'string',
        help: 'Defaults are either blank or "extra_float_digits"',
      },
      max_client_conn: {
        title: 'Max Client Connections',
        oneOf: [{ type: 'integer' }, { type: 'null' }],
        help: 'The maximum number of concurrent client connections allowed. Overrides default optimizations; refer to https://supabase.com/docs/guides/platform/custom-postgres-config#pooler-config',
      },
      default_pool_size: {
        title: 'Default Pool Size',
        oneOf: [{ type: 'integer' }, { type: 'null' }],
        help: 'The maximum number of connections made to the underlying Postgres cluster, per user+db combination. Overrides default optimizations; refer to https://supabase.com/docs/guides/platform/custom-postgres-config#pooler-config',
      },
    },
    required: ['pool_mode'],
    type: 'object',
  }

  return (
    <div id="connection-pooling">
      <SchemaFormPanel
        title="Connection Pooling Custom Configuration"
        schema={formSchema}
        model={updates}
        submitLabel="Save"
        cancelLabel="Cancel"
        loading={isUpdating}
        onChangeModel={(model: any) => setUpdates(model)}
        onSubmit={(model: any) => updateConfig(model)}
        onReset={() => setUpdates(bouncerInfo)}
        disabled={!canUpdateConnectionPoolingConfiguration}
        disabledMessage="You need additional permissions to update connection pooling settings"
      >
        <div className="space-y-6 py-4">
          {bouncerInfo.pgbouncer_enabled && (
            <>
              <AutoField
                name="pool_mode"
                showInlineError
                errorMessage="You must select one of the two options"
              />
              <div className="!mt-1 flex" style={{ marginLeft: 'calc(33% + 0.5rem)' }}>
                <p className="text-sm text-foreground-lighter">
                  Specify when a connection can be returned to the pool. To find out the most
                  suitable mode for your use case,{' '}
                  <a
                    className="text-green-900"
                    target="_blank"
                    rel="noreferrer"
                    href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool"
                  >
                    click here
                  </a>
                  .
                </p>
              </div>
              {!bouncerInfo.supavisor_enabled && (
                <>
                  <Divider light />
                  <AutoField name="ignore_startup_parameters" />
                  <Divider light />
                  <AutoField name="max_client_conn" />
                </>
              )}
              <Divider light />
              <AutoField name="default_pool_size" />
            </>
          )}
          <Divider light />
          <Input
            className="input-mono"
            layout="horizontal"
            readOnly
            copy
            disabled
            value={connectionInfo.db_port}
            label="Port"
          />
          <Divider light />
          <Input
            className="input-mono"
            layout="vertical"
            readOnly
            copy
            disabled
            label="Connection string"
            value={bouncerInfo.connectionString}
          />
        </div>
      </SchemaFormPanel>
    </div>
  )
}
