import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { capitalize } from 'lodash'
import { Fragment, useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import z from 'zod'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { FormActions } from 'components/ui/Forms/FormActions'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { usePoolingConfigurationUpdateMutation } from 'data/database/pooling-configuration-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  FormControl_Shadcn_,
  FormDescription_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  IconExternalLink,
  Input_Shadcn_,
  Listbox,
  Separator,
} from 'ui'
import { SESSION_MODE_DESCRIPTION, TRANSACTION_MODE_DESCRIPTION } from '../Database.constants'
import { POOLING_OPTIMIZATIONS } from './ConnectionPooling.constants'

const formId = 'connection-pooling-form'

// This validator validates a string to be a positive integer or if it's an empty string, transforms it to a null
const StringToPositiveNumber = z.union([
  // parse the value if it's a number
  z.number().positive().int(),
  // parse the value if it's a non-empty string
  z.string().min(1).pipe(z.coerce.number().positive().int()),
  // transform a non-empty string into a null value
  z
    .string()
    .max(0, 'The field accepts only a number')
    .transform((v) => null),
  z.null(),
])

const FormSchema = z.object({
  default_pool_size: StringToPositiveNumber,
  pool_mode: z.union([z.literal('transaction'), z.literal('session')]),
  max_client_conn: StringToPositiveNumber,
})

export const ConnectionPooling = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const snap = useDatabaseSettingsStateSnapshot()

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const computeInstance = addons?.selected_addons.find((addon) => addon.type === 'compute_instance')
  const poolingOptimizations =
    POOLING_OPTIMIZATIONS[
      (computeInstance?.variant.identifier as keyof typeof POOLING_OPTIMIZATIONS) ??
        (project?.infra_compute_size === 'nano' ? 'ci_nano' : 'ci_micro')
    ]
  const defaultPoolSize = poolingOptimizations.poolSize ?? 15
  const defaultMaxClientConn = poolingOptimizations.maxClientConn ?? 200
  const computeSize =
    computeInstance?.variant.name ?? capitalize(project?.infra_compute_size) ?? 'Micro'

  const {
    data: poolingInfo,
    error,
    isLoading,
    isError,
    isSuccess,
  } = usePoolingConfigurationQuery({ projectRef: projectRef })

  const { data: maxConnData } = useMaxConnectionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const poolingConfiguration = poolingInfo?.find((x) => x.database_type === 'PRIMARY')
  const connectionPoolingUnavailable = poolingConfiguration?.pool_mode === null

  const canUpdateConnectionPoolingConfiguration = useCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pool_mode: poolingConfiguration?.pool_mode as 'transaction' | 'session',
      default_pool_size: poolingConfiguration?.default_pool_size as number | undefined,
      max_client_conn: poolingConfiguration?.max_client_conn as number | undefined,
    },
  })

  const { mutate: updateConfiguration, isLoading: isUpdating } =
    usePoolingConfigurationUpdateMutation({
      onSuccess: (data) => {
        if (data) {
          form.reset({
            pool_mode: data.pool_mode,
            default_pool_size: data.default_pool_size,
            max_client_conn: poolingConfiguration?.max_client_conn,
          })
        }
        toast.success('Successfully saved settings')
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!poolingInfo) return console.error('Pooling info required')

    updateConfiguration({
      ref: projectRef,
      default_pool_size: data.default_pool_size as number | undefined,
      pool_mode: data.pool_mode,
    })
  }

  useEffect(() => {
    if (isSuccess) {
      form.reset({
        pool_mode: poolingConfiguration?.pool_mode as 'transaction' | 'session',
        default_pool_size: poolingConfiguration?.default_pool_size as number | undefined,
        max_client_conn: poolingConfiguration?.max_client_conn as number | undefined,
      })
    }
  }, [isSuccess])

  return (
    <section id="connection-pooler">
      <Panel
        className="!mb-0"
        title={
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <p>
                {connectionPoolingUnavailable
                  ? 'Connection Pooling is not available for this project'
                  : 'Connection pooling configuration'}
              </p>
              <Badge>Supavisor</Badge>
            </div>
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler"
              >
                Documentation
              </a>
            </Button>
          </div>
        }
        footer={
          <FormActions
            form={formId}
            isSubmitting={isUpdating}
            hasChanges={form.formState.isDirty}
            handleReset={() => form.reset()}
            helper={
              !canUpdateConnectionPoolingConfiguration
                ? 'You need additional permissions to update connection pooling settings'
                : undefined
            }
          />
        }
      >
        {isLoading && (
          <Panel.Content className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Fragment key={i}>
                <div className="grid gap-2 items-center md:grid md:grid-cols-12 md:gap-x-4 w-full">
                  <ShimmeringLoader className="h-4 w-1/3 col-span-4" delayIndex={i} />
                  <ShimmeringLoader className="h-8 w-full col-span-8" delayIndex={i} />
                </div>
                <Separator />
              </Fragment>
            ))}

            <ShimmeringLoader className="h-8 w-full" />
          </Panel.Content>
        )}

        {isError && (
          <div className="p-4">
            <AlertError error={error} subject="Failed to retrieve pooling configuration" />
          </div>
        )}

        {isSuccess && (
          <>
            {connectionPoolingUnavailable && (
              <p>Please start a new project to enable this feature.</p>
            )}
            <Form_Shadcn_ {...form}>
              <form
                id={formId}
                className="space-y-6 w-full px-8 py-8"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField_Shadcn_
                  control={form.control}
                  name="pool_mode"
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                      <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                        Pool Mode
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_ className="col-span-8">
                        <Listbox
                          disabled={poolingConfiguration?.pool_mode === 'transaction'}
                          value={field.value}
                          className="w-full"
                          onChange={(value) => field.onChange(value)}
                        >
                          <Listbox.Option key="transaction" label="Transaction" value="transaction">
                            <p>Transaction mode</p>
                            <p className="text-xs text-foreground-lighter">
                              {TRANSACTION_MODE_DESCRIPTION}
                            </p>
                          </Listbox.Option>
                          <Listbox.Option key="session" label="Session" value="session">
                            <p>Session mode</p>
                            <p className="text-xs text-foreground-lighter">
                              {SESSION_MODE_DESCRIPTION}
                            </p>
                          </Listbox.Option>
                        </Listbox>
                      </FormControl_Shadcn_>

                      {poolingConfiguration?.pool_mode === 'transaction' && (
                        <FormDescription_Shadcn_ className="col-start-5 col-span-8 flex flex-col gap-y-2">
                          <Alert_Shadcn_>
                            <AlertTitle_Shadcn_ className="text-foreground">
                              Pool mode is permanently set to Transaction on port 6543
                            </AlertTitle_Shadcn_>
                            <AlertDescription_Shadcn_>
                              You can use Session mode by connecting to the pooler on port 5432
                              instead
                            </AlertDescription_Shadcn_>
                          </Alert_Shadcn_>
                        </FormDescription_Shadcn_>
                      )}

                      {poolingConfiguration?.pool_mode === 'session' && (
                        <>
                          {field.value === 'transaction' ? (
                            <FormDescription_Shadcn_ className="col-start-5 col-span-8 flex flex-col gap-y-2">
                              <Alert_Shadcn_>
                                <AlertTitle_Shadcn_ className="text-foreground">
                                  Pool mode will be set to transaction permanently on port 6543
                                </AlertTitle_Shadcn_>
                                <AlertDescription_Shadcn_>
                                  This will take into effect once saved. You can use session mode by
                                  pointing the pooler connection to use port 5432.
                                </AlertDescription_Shadcn_>
                              </Alert_Shadcn_>
                            </FormDescription_Shadcn_>
                          ) : (
                            <FormDescription_Shadcn_ className="col-start-5 col-span-8 flex flex-col gap-y-2">
                              <Alert_Shadcn_>
                                <AlertTitle_Shadcn_ className="text-foreground">
                                  Set to transaction mode to use both pooling modes concurrently
                                </AlertTitle_Shadcn_>
                                <AlertDescription_Shadcn_>
                                  Session mode can be used concurrently with transaction mode by
                                  using 5432 for session and 6543 for transaction. However, by
                                  configuring the pooler mode to session here, you will not be able
                                  to use transaction mode at the same time.
                                </AlertDescription_Shadcn_>
                              </Alert_Shadcn_>
                            </FormDescription_Shadcn_>
                          )}
                        </>
                      )}

                      <FormDescription_Shadcn_ className="col-start-5 col-span-8 flex flex-col gap-y-2">
                        <p>
                          Specify when a connection can be returned to the pool.{' '}
                          <span
                            tabIndex={0}
                            onClick={() => snap.setShowPoolingModeHelper(true)}
                            className="cursor-pointer underline underline-offset-2"
                          >
                            Learn more about pool modes
                          </span>
                          .
                        </p>
                      </FormDescription_Shadcn_>

                      <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                    </FormItem_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  control={form.control}
                  name="default_pool_size"
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                      <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                        Pool Size
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_ className="col-span-8">
                        <Input_Shadcn_
                          {...field}
                          type="number"
                          className="w-full"
                          value={field.value || undefined}
                          placeholder={field.value === null ? `${defaultPoolSize}` : ''}
                        />
                      </FormControl_Shadcn_>
                      {maxConnData !== undefined &&
                        Number(form.getValues('default_pool_size') ?? 15) >
                          maxConnData.maxConnections * 0.8 && (
                          <div className="col-start-5 col-span-8">
                            <Alert_Shadcn_ variant="warning">
                              <AlertTitle_Shadcn_ className="text-foreground">
                                Pool size is greater than 80% of the max connections (
                                {maxConnData.maxConnections}) on your database
                              </AlertTitle_Shadcn_>
                              <AlertDescription_Shadcn_>
                                This may result in instability and unreliability with your database
                                connections.
                              </AlertDescription_Shadcn_>
                            </Alert_Shadcn_>
                          </div>
                        )}
                      <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                        The maximum number of connections made to the underlying Postgres cluster,
                        per user+db combination. Pool size has a default of {defaultPoolSize} based
                        on your compute size of {computeSize}.
                      </FormDescription_Shadcn_>
                      <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                        Please refer to our{' '}
                        <a
                          href="https://supabase.com/docs/guides/platform/custom-postgres-config#pooler-config"
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          documentation
                        </a>{' '}
                        to find out more.
                      </FormDescription_Shadcn_>
                      <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                    </FormItem_Shadcn_>
                  )}
                />
                <FormField_Shadcn_
                  disabled
                  control={form.control}
                  name="max_client_conn"
                  render={({ field }) => (
                    <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                      <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                        Max Client Connections
                      </FormLabel_Shadcn_>
                      <FormControl_Shadcn_ className="col-span-8">
                        <Input_Shadcn_
                          {...field}
                          value={field.value || undefined}
                          className="w-full"
                          placeholder={field.value === null ? `${defaultMaxClientConn}` : ''}
                        />
                      </FormControl_Shadcn_>
                      <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                        The maximum number of concurrent client connections allowed. This value is
                        fixed at {defaultMaxClientConn} based on your compute size of {computeSize}{' '}
                        and cannot be changed.
                      </FormDescription_Shadcn_>
                      <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                        Please refer to our{' '}
                        <a
                          href="https://supabase.com/docs/guides/platform/custom-postgres-config#pooler-config"
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          documentation
                        </a>{' '}
                        to find out more.
                      </FormDescription_Shadcn_>
                      <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                    </FormItem_Shadcn_>
                  )}
                />
              </form>
            </Form_Shadcn_>
            <div className="border-muted border-t"></div>
          </>
        )}
      </Panel>
    </section>
  )
}
