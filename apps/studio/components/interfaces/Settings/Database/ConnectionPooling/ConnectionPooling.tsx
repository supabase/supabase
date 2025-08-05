import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { capitalize } from 'lodash'
import { Fragment, useEffect, useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { setValueAsNullableNumber } from 'components/ui/Forms/Form.constants'
import { FormActions } from 'components/ui/Forms/FormActions'
import { InlineLink } from 'components/ui/InlineLink'
import Panel from 'components/ui/Panel'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { usePgbouncerConfigQuery } from 'data/database/pgbouncer-config-query'
import { usePgbouncerConfigurationUpdateMutation } from 'data/database/pgbouncer-config-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Separator,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { POOLING_OPTIMIZATIONS } from './ConnectionPooling.constants'

const formId = 'pooling-configuration-form'

const PoolingConfigurationFormSchema = z.object({
  default_pool_size: z.number().nullable(),
  max_client_conn: z.number().nullable(),
})

/**
 * [Joshen] PgBouncer configuration will be the main endpoint for GET and PATCH of pooling config
 */
export const ConnectionPooling = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const { data: org } = useSelectedOrganizationQuery()

  const canUpdateConnectionPoolingConfiguration = useCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    { resource: { project_id: project?.id } }
  )

  const {
    data: pgbouncerConfig,
    error: pgbouncerConfigError,
    isLoading: isLoadingPgbouncerConfig,
    isError: isErrorPgbouncerConfig,
    isSuccess: isSuccessPgbouncerConfig,
  } = usePgbouncerConfigQuery({ projectRef })

  const disablePoolModeSelection = useMemo(() => {
    return org?.plan?.id === 'free'
  }, [org])

  const { data: maxConnData } = useMaxConnectionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: addons, isSuccess: isSuccessAddons } = useProjectAddonsQuery({ projectRef })

  const { mutate: updatePoolerConfig, isLoading: isUpdatingPoolerConfig } =
    usePgbouncerConfigurationUpdateMutation()

  const hasIpv4Addon = !!addons?.selected_addons.find((addon) => addon.type === 'ipv4')
  const computeInstance = addons?.selected_addons.find((addon) => addon.type === 'compute_instance')
  const computeSize =
    computeInstance?.variant.name ?? capitalize(project?.infra_compute_size) ?? 'Nano'
  const poolingOptimizations =
    POOLING_OPTIMIZATIONS[
      (computeInstance?.variant.identifier as keyof typeof POOLING_OPTIMIZATIONS) ??
        (project?.infra_compute_size === 'nano' ? 'ci_nano' : 'ci_micro')
    ]
  const defaultPoolSize = poolingOptimizations.poolSize ?? 15
  const defaultMaxClientConn = poolingOptimizations.maxClientConn ?? 200

  const form = useForm<z.infer<typeof PoolingConfigurationFormSchema>>({
    resolver: zodResolver(PoolingConfigurationFormSchema),
    defaultValues: {
      default_pool_size: undefined,
      max_client_conn: null,
    },
  })
  const { default_pool_size } = form.watch()
  const connectionPoolingUnavailable = pgbouncerConfig?.pool_mode === null
  const ignoreStartupParameters = pgbouncerConfig?.ignore_startup_parameters

  const onSubmit: SubmitHandler<z.infer<typeof PoolingConfigurationFormSchema>> = async (data) => {
    const { default_pool_size } = data

    if (!projectRef) return console.error('Project ref is required')

    updatePoolerConfig(
      {
        ref: projectRef,
        default_pool_size: default_pool_size === null ? undefined : default_pool_size,
        ignore_startup_parameters: ignoreStartupParameters ?? '',
      },
      {
        onSuccess: (data) => {
          toast.success(`Successfully updated pooler configuration`)
          if (data) {
            form.reset({
              default_pool_size: data.default_pool_size,
            })
          }
        },
      }
    )
  }

  const resetForm = () => {
    form.reset({
      default_pool_size: pgbouncerConfig?.default_pool_size ?? defaultPoolSize,
      max_client_conn: pgbouncerConfig?.max_client_conn ?? defaultMaxClientConn,
    })
  }

  useEffect(() => {
    if (isSuccessPgbouncerConfig) resetForm()
  }, [isSuccessPgbouncerConfig])

  return (
    <section id="connection-pooler">
      <Panel
        className="!mb-0"
        title={
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <p>Connection pooling configuration</p>
              {disablePoolModeSelection ? (
                <Badge>Shared Pooler</Badge>
              ) : (
                <Badge>Shared/Dedicated Pooler</Badge>
              )}
            </div>
            <DocsButton href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler" />
          </div>
        }
        footer={
          <FormActions
            form={formId}
            isSubmitting={isUpdatingPoolerConfig}
            hasChanges={form.formState.isDirty}
            handleReset={() => resetForm()}
            helper={
              !canUpdateConnectionPoolingConfiguration
                ? 'You need additional permissions to update connection pooling settings'
                : undefined
            }
          />
        }
      >
        {isSuccessAddons && !disablePoolModeSelection && !hasIpv4Addon && (
          <Admonition
            className="border-x-0 border-t-0 rounded-none"
            type="default"
            title="Dedicated Pooler is not IPv4 compatible"
          >
            <p className="!m-0">
              If your network only supports IPv4, consider purchasing the{' '}
              <InlineLink href={`/project/${projectRef}/settings/addons?panel=ipv4`}>
                IPv4 add-on
              </InlineLink>
            </p>
          </Admonition>
        )}
        <Panel.Content>
          {isLoadingPgbouncerConfig && (
            <div className="flex flex-col gap-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Fragment key={`loader-${i}`}>
                  <div className="grid gap-2 items-center md:grid md:grid-cols-12 md:gap-x-4 w-full">
                    <ShimmeringLoader className="h-4 w-1/3 col-span-4" delayIndex={i} />
                    <ShimmeringLoader className="h-8 w-full col-span-8" delayIndex={i} />
                  </div>
                  <Separator />
                </Fragment>
              ))}

              <ShimmeringLoader className="h-8 w-full" />
            </div>
          )}
          {isErrorPgbouncerConfig && (
            <AlertError
              error={pgbouncerConfigError}
              subject="Failed to retrieve connection pooler configuration"
            />
          )}
          {connectionPoolingUnavailable && (
            <Admonition
              type="default"
              title="Unable to retrieve pooling configuration"
              description="Please start a new project to enable this feature"
            />
          )}
          {isSuccessPgbouncerConfig && (
            <Form_Shadcn_ {...form}>
              <form
                id={formId}
                className="flex flex-col gap-y-6 w-full"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField_Shadcn_
                  control={form.control}
                  name="default_pool_size"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Pool Size"
                      description={
                        <p>
                          The maximum number of connections made to the underlying Postgres cluster,
                          per user+db combination. Pool size has a default of {defaultPoolSize}{' '}
                          based on your compute size of {computeSize}.
                        </p>
                      }
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          type="number"
                          className="w-full"
                          value={field.value || ''}
                          placeholder={defaultPoolSize.toString()}
                          {...form.register('default_pool_size', {
                            setValueAs: setValueAsNullableNumber,
                          })}
                        />
                      </FormControl_Shadcn_>
                      {!!maxConnData &&
                        (default_pool_size ?? 15) > maxConnData.maxConnections * 0.8 && (
                          <Alert_Shadcn_ variant="warning" className="mt-2">
                            <AlertTitle_Shadcn_ className="text-foreground">
                              Pool size is greater than 80% of the max connections (
                              {maxConnData.maxConnections}) on your database
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_>
                              This may result in instability and unreliability with your database
                              connections.
                            </AlertDescription_Shadcn_>
                          </Alert_Shadcn_>
                        )}
                    </FormItemLayout>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="max_client_conn"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="Max Client Connections"
                      description={
                        <>
                          <p>
                            The maximum number of concurrent client connections allowed. This value
                            is fixed at {defaultMaxClientConn} based on your compute size of{' '}
                            {computeSize} and cannot be changed.
                          </p>
                          <p className="mt-2">
                            Please refer to our{' '}
                            <InlineLink href="https://supabase.com/docs/guides/database/connection-management#configuring-supavisors-pool-size">
                              documentation
                            </InlineLink>{' '}
                            to find out more.
                          </p>
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          {...field}
                          type="number"
                          className="w-full"
                          value={pgbouncerConfig?.max_client_conn || ''}
                          disabled={true}
                          placeholder={defaultMaxClientConn.toString()}
                          {...form.register('max_client_conn', {
                            setValueAs: setValueAsNullableNumber,
                          })}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </form>
            </Form_Shadcn_>
          )}
        </Panel.Content>
      </Panel>
    </section>
  )
}
