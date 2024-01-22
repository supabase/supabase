import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Fragment, useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
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
  Input,
  Input_Shadcn_,
  Listbox,
} from 'ui'
import z from 'zod'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import Divider from 'components/ui/Divider'
import { FormActions } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { usePoolingConfigurationUpdateMutation } from 'data/database/pooling-configuration-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions, useStore } from 'hooks'
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
  ignore_startup_parameters: z.string(),
  pool_mode: z.union([z.literal('transaction'), z.literal('session'), z.literal('statement')]),
  max_client_conn: StringToPositiveNumber,
})

export const ConnectionPooling = () => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const { project, isLoading: projectIsLoading } = useProjectContext()

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const computeInstance = addons?.selected_addons.find((addon) => addon.type === 'compute_instance')

  const {
    data: poolingInfo,
    error,
    isLoading,
    isError,
    isSuccess,
  } = usePoolingConfigurationQuery({ projectRef: projectRef })

  const connectionPoolingUnavailable =
    !poolingInfo?.pgbouncer_enabled && poolingInfo?.pool_mode === null

  // [Joshen] TODO this needs to be obtained from BE as 26th Jan is when we'll start - projects will be affected at different rates
  const resolvesToIpV6 = !poolingInfo?.supavisor_enabled && false // Number(new Date()) > Number(dayjs.utc('01-26-2024', 'MM-DD-YYYY').toDate())

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
      ignore_startup_parameters: poolingInfo?.ignore_startup_parameters,
      pool_mode: poolingInfo?.pool_mode as 'transaction' | 'session' | 'statement',
      default_pool_size: poolingInfo?.default_pool_size as number | undefined,
      max_client_conn: poolingInfo?.max_client_conn as number | undefined,
    },
  })

  const { mutateAsync: updateConfiguration, isLoading: isUpdating } =
    usePoolingConfigurationUpdateMutation({
      onSuccess: (data) => {
        if (data) {
          form.reset({
            ignore_startup_parameters: data.ignore_startup_parameters,
            pool_mode: data.pool_mode,
            default_pool_size: data.default_pool_size,
            max_client_conn: data.max_client_conn,
          })
        }

        ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!poolingInfo) return console.error('Pooling info required')

    try {
      await updateConfiguration({
        ref: projectRef,
        // pgbouncer can't be disabled in the UI, so just pass it along
        pgbouncer_enabled: poolingInfo.pgbouncer_enabled,
        default_pool_size: data.default_pool_size as number | undefined,
        ignore_startup_parameters: data.ignore_startup_parameters,
        pool_mode: data.pool_mode,
        max_client_conn: data.max_client_conn,
      })
    } finally {
    }
  }

  useEffect(() => {
    if (isSuccess) {
      form.reset({
        ignore_startup_parameters: poolingInfo?.ignore_startup_parameters,
        pool_mode: poolingInfo?.pool_mode as 'transaction' | 'session' | 'statement',
        default_pool_size: poolingInfo?.default_pool_size as number | undefined,
        max_client_conn: poolingInfo?.max_client_conn as number | undefined,
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
              {isSuccess && (
                <div className="flex items-center gap-x-1">
                  <Badge color="scale">
                    {poolingInfo?.supavisor_enabled ? 'Supavisor' : 'PGBouncer'}
                  </Badge>
                </div>
              )}
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
          (poolingInfo?.pgbouncer_enabled ?? false) && (
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
          )
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
                <Divider light />
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
            {poolingInfo.pgbouncer_enabled && (
              <>
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
                              value={field.value}
                              className="w-full"
                              onChange={(value) => field.onChange(value)}
                            >
                              <Listbox.Option
                                key="transaction"
                                label="Transaction"
                                value="transaction"
                              >
                                <p>Transaction mode</p>
                                <p className="text-xs text-foreground-lighter">
                                  Connection is assigned to the client for the duration of a
                                  transaction. Some session-based Postgres features such as prepared
                                  statements are not available with this option.
                                </p>
                              </Listbox.Option>
                              <Listbox.Option key="session" label="Session" value="session">
                                <p>Session mode</p>
                                <p className="text-xs text-foreground-lighter">
                                  When a new client connects, a connection is assigned to the client
                                  until it disconnects. All Postgres features can be used with this
                                  option.
                                </p>
                              </Listbox.Option>
                            </Listbox>
                          </FormControl_Shadcn_>
                          <FormDescription_Shadcn_ className="col-start-5 col-span-8 flex flex-col gap-y-2">
                            <p>
                              Specify when a connection can be returned to the pool. Please refer to
                              our{' '}
                              <a
                                href="https://supabase.com/docs/guides/database/connecting-to-postgres#how-connection-pooling-works"
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                documentation
                              </a>{' '}
                              to find out the most suitable mode for your use case.
                            </p>
                            <p>
                              If you're using{' '}
                              <span className="text-foreground">prepared statements</span> in your
                              database, you will need to either use the{' '}
                              <span className="text-foreground">Session</span> pool mode or use port{' '}
                              <span className="text-foreground">5432</span> in the connection
                              string.
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
                            Default Pool Size
                          </FormLabel_Shadcn_>
                          <FormControl_Shadcn_ className="col-span-8">
                            <Input_Shadcn_
                              className="w-full"
                              {...field}
                              value={field.value || undefined}
                              placeholder={
                                poolingInfo.supavisor_enabled && field.value === null
                                  ? `Default: ${
                                      POOLING_OPTIMIZATIONS?.[
                                        computeInstance?.variant
                                          .identifier as keyof typeof POOLING_OPTIMIZATIONS
                                      ]?.poolSize ?? 15
                                    }`
                                  : ''
                              }
                            />
                          </FormControl_Shadcn_>
                          <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                            The maximum number of connections made to the underlying Postgres
                            cluster, per user+db combination. Overrides default optimizations;
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
                    {!poolingInfo?.supavisor_enabled && (
                      <FormField_Shadcn_
                        control={form.control}
                        name="ignore_startup_parameters"
                        render={({ field }) => (
                          <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                            <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                              Ignore Startup Parameters
                            </FormLabel_Shadcn_>
                            <FormControl_Shadcn_ className="col-span-8">
                              <Input_Shadcn_ {...field} className="w-full" />
                            </FormControl_Shadcn_>
                            <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                              Defaults are either blank or "extra_float_digits"
                            </FormDescription_Shadcn_>
                            <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                          </FormItem_Shadcn_>
                        )}
                      />
                    )}
                    <FormField_Shadcn_
                      control={form.control}
                      disabled={poolingInfo.supavisor_enabled}
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
                              placeholder={
                                poolingInfo.supavisor_enabled
                                  ? poolingInfo.supavisor_enabled && field.value === null
                                    ? `${
                                        POOLING_OPTIMIZATIONS?.[
                                          computeInstance?.variant
                                            .identifier as keyof typeof POOLING_OPTIMIZATIONS
                                        ]?.maxClientConn ?? 200
                                      }`
                                    : ''
                                  : ''
                              }
                            />
                          </FormControl_Shadcn_>
                          <FormDescription_Shadcn_ className="col-start-5 col-span-8">
                            The maximum number of concurrent client connections allowed.{' '}
                            {poolingInfo.supavisor_enabled
                              ? 'This value is fixed and cannot be changed. '
                              : 'Overrides default optimizations. '}
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
          </>
        )}
      </Panel>
    </section>
  )
}
