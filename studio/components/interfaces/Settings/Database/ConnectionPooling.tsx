import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Fragment } from 'react'
import { Input, Form, InputNumber, Listbox } from 'ui'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { number, object, string } from 'yup'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
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
                <p className="text-scale-1000">
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

  const { isLoading } = usePoolingConfigurationQuery({ projectRef })

  const formId = 'connection-pooler-form'

  const INITIAL_VALUES = {
    pool_mode: bouncerInfo.pool_mode || 'transaction',
    default_pool_size: bouncerInfo.default_pool_size || 10,
    ignore_startup_parameters: bouncerInfo.ignore_startup_parameters || '',
    pgbouncer_enabled: bouncerInfo.pgbouncer_enabled,
    max_client_connections: bouncerInfo.max_client_conn || undefined,
  }

  const schema = object({
    pool_mode: string(),
    ignore_startup_parameters: string(),
    default_pool_size: number().min(10),
    max_client_connections: number(),
  })

  const { mutateAsync: updateConfiguration, isLoading: isUpdating } =
    usePoolingConfigurationUpdateMutation({
      onSuccess: () => {
        ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
      },
    })

  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const onSubmit = async (values: any) => {
    try {
      await updateConfiguration({
        ref: projectRef,
        pgbouncer_enabled: values.pgbouncer_enabled,
        default_pool_size: values.default_pool_size,
        ignore_startup_parameters: values.ignore_startup_parameters,
        pool_mode: values.pool_mode,
        max_client_conn: values.max_client_connections,
      })
    } finally {
    }
  }

  return (
    <div>
      <Form
        id={formId}
        initialValues={INITIAL_VALUES}
        onSubmit={onSubmit}
        validationSchema={schema}
      >
        {({ handleReset, values, initialValues }: any) => {
          const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

          return (
            <>
              <FormHeader
                title="Connection Pooling Custom Configuration"
                description="Configure your connection pool settings"
              />
              <FormPanel
                disabled={true}
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isUpdating}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
                      disabled={!canUpdateConfig}
                      helper={
                        !canUpdateConfig
                          ? 'You need additional permissions to update authentication settings'
                          : undefined
                      }
                    />
                  </div>
                }
              >
                {bouncerInfo.pgbouncer_enabled && (
                  <FormSection header={<FormSectionLabel>Pool Mode</FormSectionLabel>}>
                    <FormSectionContent loading={isUpdating}>
                      <Listbox size="medium" id="pool_mode" name="pool_mode">
                        <Listbox.Option
                          key="transaction"
                          id="transaction"
                          value="transaction"
                          label="Transaction"
                        >
                          Transaction
                        </Listbox.Option>
                        <Listbox.Option key="session" id="session" value="session" label="Session">
                          Session
                        </Listbox.Option>
                      </Listbox>
                      <p className="text-sm text-lighter -mt-2">
                        Specify when a connection can be returned to the pool. To find out the most
                        suitable mode for your use case, refer to the{' '}
                        <a
                          className="text-green-900"
                          target="_blank"
                          rel="noreferrer"
                          href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool"
                        >
                          documentation
                        </a>
                        .
                      </p>
                    </FormSectionContent>
                  </FormSection>
                )}

                <FormSection
                  header={<FormSectionLabel>Ignore Startup Parameters</FormSectionLabel>}
                >
                  <FormSectionContent loading={isLoading}>
                    <Input
                      id="ignore_startup_parameters"
                      size="small"
                      disabled={!canUpdateConfig}
                    />
                    <p className="text-sm text-lighter -mt-2">
                      Defaults are either blank or "extra_float_digits"
                    </p>
                  </FormSectionContent>
                </FormSection>
                {bouncerInfo.pgbouncer_enabled && (
                  <>
                    <FormSection
                      header={<FormSectionLabel>Max client connections</FormSectionLabel>}
                    >
                      <FormSectionContent loading={isLoading}>
                        <InputNumber
                          id="max_client_connections"
                          size="small"
                          disabled={!canUpdateConfig}
                        />
                        <p className="text-sm text-lighter -mt-2">
                          The maximum number of concurrent client connections allowed. Overrides
                          default optimizations; refer to the{' '}
                          <a
                            className="text-green-900"
                            target="_blank"
                            rel="noreferrer"
                            href="https://supabase.com/docs/guides/platform/custom-postgres-config#pooler-config"
                          >
                            documentation
                          </a>
                          .
                        </p>
                      </FormSectionContent>
                    </FormSection>
                    <FormSection header={<FormSectionLabel>Default pool size</FormSectionLabel>}>
                      <FormSectionContent loading={isLoading}>
                        <InputNumber
                          id="default_pool_size"
                          size="small"
                          min={10}
                          disabled={!canUpdateConfig}
                        />
                        <p className="text-sm text-lighter -mt-2">
                          The maximum number of connections made to the underlying Postgres cluster,
                          per user+db combination. Overrides default optimizations; refer to the{' '}
                          <a
                            className="text-green-900"
                            target="_blank"
                            rel="noreferrer"
                            href="https://supabase.com/docs/guides/platform/custom-postgres-config#pooler-config"
                          >
                            documentation
                          </a>
                          .
                        </p>
                      </FormSectionContent>
                    </FormSection>
                  </>
                )}
                <FormSection header={<FormSectionLabel>Port</FormSectionLabel>}>
                  <FormSectionContent loading={isLoading}>
                    <Input
                      className="input-mono"
                      readOnly
                      copy
                      disabled
                      value={connectionInfo.db_port}
                    />
                  </FormSectionContent>
                </FormSection>
                <FormSection header={<FormSectionLabel>Connection string</FormSectionLabel>}>
                  <FormSectionContent loading={isLoading}>
                    <Input
                      className="input-mono"
                      layout="vertical"
                      readOnly
                      copy
                      disabled
                      value={bouncerInfo.connectionString}
                    />
                  </FormSectionContent>
                </FormSection>
                <div className="border-t border-scale-400"></div>
              </FormPanel>
            </>
          )
        }}
      </Form>
    </div>
  )
}
