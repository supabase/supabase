import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { capitalize } from 'lodash'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
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
import { usePgbouncerStatusQuery } from 'data/database/pgbouncer-status-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import { useSupavisorConfigurationUpdateMutation } from 'data/database/supavisor-configuration-update-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Listbox,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { SESSION_MODE_DESCRIPTION, TRANSACTION_MODE_DESCRIPTION } from '../Database.constants'
import { POOLING_OPTIMIZATIONS } from './ConnectionPooling.constants'

const formId = 'pooling-configuration-form'

const PoolingConfigurationFormSchema = z.object({
  type: z.union([z.literal('Supavisor'), z.literal('PgBouncer')]),
  default_pool_size: z.number().nullable(),
  pool_mode: z.union([z.literal('transaction'), z.literal('session'), z.literal('statement')]),
  max_client_conn: z.number().nullable(),
})

/**
 * [Joshen] Some outstanding questions that need clarification for support both type of poolers
 * I've left comments in the code itself below, but just leaving a summary here for easier reference
 * - How to check for when Supavisor is ready to receive connections? We have pgbouncer/status for PgBouncer
 * - Are we currently ensuring the 2 hour window on the BE? I noticed pgbouncer/status flips active to false in a second after setting pgbouncer_enabled to false
 * - Existing projects currently have pgbouncer_enabled and supavisor_enabled as true, are we going to backfill?
 *   - We're using pgbouncer_enabled to determine the pooler type, which means that all projects are going to show on the UI that pgbouncer is being used
 *
 * Apart from the above, some pointers to note:
 * - max_client_conn should be editable for pgbouncer
 * - (Nice to have) Show a countdown of 2 hours when the pooler is swapped as a UI indication for users
 * - [TODO] Connect UI needs to be updated to show the correct pooler connection string depending on which type is being used
 * - [TODO] Project addons IPv4 needs an update on the CTA "You do not need...", needs to now be dependent on the Pooler type
 *
 * Added a feature flag just in case
 * - Toggles visibility of Pooler Type input field
 * - Whether to use pgbouncer_enabled to determine pooler type
 */

export const ConnectionPooling = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const org = useSelectedOrganization()
  const snap = useDatabaseSettingsStateSnapshot()
  const allowPgBouncerSelection = useFlag('dualPoolerSupport')

  const toastIdRef = useRef<string | number>()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [refetchPgBouncerStatus, setRefetchPgBouncerStatus] = useState<boolean>(false)

  const canUpdateConnectionPoolingConfiguration = useCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    { resource: { project_id: project?.id } }
  )

  const {
    data: supavisorPoolingInfo,
    error: supavisorConfigError,
    isLoading: isLoadingSupavisorConfig,
    isError: isErrorSupavisorConfig,
    isSuccess: isSuccessSupavisorConfig,
  } = useSupavisorConfigurationQuery({ projectRef })

  const {
    data: pgbouncerConfig,
    error: pgbouncerConfigError,
    isLoading: isLoadingPgbouncerConfig,
    isError: isErrorPgbouncerConfig,
    isSuccess: isSuccessPgbouncerConfig,
  } = usePgbouncerConfigQuery({ projectRef })

  const { data: maxConnData } = useMaxConnectionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })

  usePgbouncerStatusQuery(
    { projectRef },
    {
      refetchInterval: (data) => {
        // [Joshen] Need to clarify the following:
        // - How to check for when Supavisor is ready to receive connections when swapping over to Supavisor
        // - I notice status goes to false when i swap over to Supavisor in 2 seconds, does this mean that PgBouncer is already offline?
        // - Cause we need to consider the 2 hour window that we're providing for users to swap over the pooler connection strings
        if (refetchPgBouncerStatus) {
          if (
            (!!pgbouncerConfig?.pgbouncer_enabled && !data?.active) ||
            (!pgbouncerConfig?.pgbouncer_enabled && !!data?.active)
          ) {
            return 2000
          } else {
            toast.success(
              `${data?.active ? 'Dedicated Pooler' : 'Supavisor'} is now ready to receive connections!`,
              { id: toastIdRef.current }
            )
            toastIdRef.current = undefined
            setRefetchPgBouncerStatus(false)
            return false
          }
        } else {
          return false
        }
      },
    }
  )

  const { mutate: updateSupavisorConfig, isLoading: isUpdatingSupavisor } =
    useSupavisorConfigurationUpdateMutation()
  const {
    mutate: updatePgbouncerConfig,
    mutateAsync: updatePgBouncerConfigAsync,
    isLoading: isUpdatingPgBouncer,
  } = usePgbouncerConfigurationUpdateMutation()

  const form = useForm<z.infer<typeof PoolingConfigurationFormSchema>>({
    resolver: zodResolver(PoolingConfigurationFormSchema),
    defaultValues: {
      type: undefined,
      pool_mode: undefined,
      default_pool_size: undefined,
      max_client_conn: null,
    },
  })
  const { type, default_pool_size } = form.watch()
  const error = useMemo(
    () =>
      allowPgBouncerSelection && type === 'PgBouncer' ? pgbouncerConfigError : supavisorConfigError,
    [allowPgBouncerSelection, type, pgbouncerConfigError, supavisorConfigError]
  )
  const isLoading = useMemo(
    () =>
      allowPgBouncerSelection && type === 'PgBouncer'
        ? isLoadingPgbouncerConfig
        : isLoadingSupavisorConfig,
    [allowPgBouncerSelection, type, isLoadingPgbouncerConfig, isLoadingSupavisorConfig]
  )
  const isError = useMemo(
    () =>
      allowPgBouncerSelection && type === 'PgBouncer'
        ? isErrorPgbouncerConfig
        : isErrorSupavisorConfig,
    [allowPgBouncerSelection, type, isErrorPgbouncerConfig, isErrorSupavisorConfig]
  )
  const isSuccess = useMemo(
    () =>
      allowPgBouncerSelection && type === 'PgBouncer'
        ? isSuccessPgbouncerConfig
        : isSuccessSupavisorConfig,
    [allowPgBouncerSelection, type, isSuccessPgbouncerConfig, isSuccessSupavisorConfig]
  )
  const isSaving = isUpdatingSupavisor || isUpdatingPgBouncer

  const currentPooler = allowPgBouncerSelection
    ? pgbouncerConfig?.pgbouncer_enabled
      ? 'PgBouncer'
      : 'Supavisor'
    : 'Supavisor'
  // [Joshen] These are labels just for user-facing texts
  const formattedCurrentPooler =
    currentPooler === 'PgBouncer' ? 'the Dedicated Pooler' : currentPooler
  const formattedTargetPooler = type === 'PgBouncer' ? 'the Dedicated Pooler' : type

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

  const isFreePlan = subscription?.plan.id === 'free'
  const supavisorConfig = supavisorPoolingInfo?.find((x) => x.database_type === 'PRIMARY')
  const connectionPoolingUnavailable =
    type === 'PgBouncer' ? pgbouncerConfig?.pool_mode === null : supavisorConfig?.pool_mode === null
  const disablePoolModeSelection =
    type === 'Supavisor' && supavisorConfig?.pool_mode === 'transaction'
  const disablePgBouncerSelection = computeSize === 'Nano'
  const showPoolModeWarning = type === 'Supavisor' && supavisorConfig?.pool_mode === 'session'
  const isChangingPoolerType =
    (currentPooler === 'PgBouncer' && type === 'Supavisor') ||
    (currentPooler === 'Supavisor' && type === 'PgBouncer')

  const poolerSwitchWarningTitle =
    'Your current pooler will be active for 2 hours before fully deactivated'
  const poolerSwitchWarningDescription = `Migrate your applications from ${formattedCurrentPooler} to ${formattedTargetPooler} during this time by switching to ${formattedTargetPooler} connection strings in your applications.`

  const onSubmit: SubmitHandler<z.infer<typeof PoolingConfigurationFormSchema>> = async (data) => {
    const { type, pool_mode, default_pool_size, max_client_conn } = data

    if (!projectRef) return console.error('Project ref is required')
    if (isChangingPoolerType && !showConfirmation) return setShowConfirmation(true)

    if (type === 'PgBouncer') {
      if (!pgbouncerConfig) return console.error('Pgbouncer configuration is required')
      updatePgbouncerConfig(
        {
          ref: projectRef,
          pgbouncer_enabled: true,
          ignore_startup_parameters: pgbouncerConfig.ignore_startup_parameters ?? '',
          pool_mode: pool_mode as 'transaction' | 'session' | 'statement',
          max_client_conn,
          default_pool_size: default_pool_size as number | undefined,
        },
        {
          onSuccess: (data) => {
            if (isChangingPoolerType) {
              const toastId = toast.loading('Swapping pooler to the Dedicated Pooler')
              toastIdRef.current = toastId
              setRefetchPgBouncerStatus(true)
            } else {
              toast.success(`Successfully updated Dedicated Pooler configuration`)
            }

            setShowConfirmation(false)
            form.reset({ type: 'PgBouncer', ...data })
          },
        }
      )
    } else if (type === 'Supavisor') {
      if (isChangingPoolerType && pgbouncerConfig) {
        await updatePgBouncerConfigAsync({
          ref: projectRef,
          pgbouncer_enabled: false,
          ignore_startup_parameters: pgbouncerConfig.ignore_startup_parameters ?? '',
          pool_mode: pgbouncerConfig.pool_mode as 'transaction' | 'session' | 'statement',
        })
      }
      updateSupavisorConfig(
        {
          ref: projectRef,
          default_pool_size,
        },
        {
          onSuccess: (data) => {
            if (isChangingPoolerType) {
              const toastId = toast.loading('Swapping pooler to Supavisor')
              toastIdRef.current = toastId
              setRefetchPgBouncerStatus(true)
            } else {
              toast.success(`Successfully updated Supavisor configuration`)
            }
            setShowConfirmation(false)
            form.reset({ type: 'Supavisor', ...data })
          },
        }
      )
    }
  }

  const resetForm = () => {
    if (currentPooler === 'PgBouncer') {
      if (pgbouncerConfig) {
        form.reset({
          type: 'PgBouncer',
          pool_mode: pgbouncerConfig.pool_mode,
          default_pool_size: pgbouncerConfig.default_pool_size,
          max_client_conn: pgbouncerConfig.max_client_conn,
        })
      }
    } else {
      if (supavisorConfig) {
        form.reset({
          type: 'Supavisor',
          pool_mode: supavisorConfig.pool_mode,
          default_pool_size: supavisorConfig.default_pool_size,
          max_client_conn: supavisorConfig.max_client_conn,
        })
      }
    }
  }

  useEffect(() => {
    // [Joshen] We're using pgbouncer_enabled from pgbouncer's config to determine the current type
    if (isSuccessPgbouncerConfig && isSuccessSupavisorConfig) {
      resetForm()
    }
  }, [isSuccessPgbouncerConfig, isSuccessSupavisorConfig])

  return (
    <section id="connection-pooler">
      <Panel
        className="!mb-0"
        title={
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <p>Connection pooling configuration</p>
              {!allowPgBouncerSelection && <Badge>Supavisor</Badge>}
            </div>
            <DocsButton href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler" />
          </div>
        }
        footer={
          <FormActions
            form={formId}
            isSubmitting={isSaving}
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
        <Panel.Content>
          {isLoading && (
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
          {isError && (
            <AlertError
              error={error}
              subject="Failed to retrieve connection pooler configuration"
            />
          )}
          {isSuccess && (
            <>
              {connectionPoolingUnavailable && (
                <Admonition
                  type="default"
                  title="Unable to retrieve pooling configuration"
                  description="Please start a new project to enable this feature"
                />
              )}
              <Form_Shadcn_ {...form}>
                <form
                  id={formId}
                  className="flex flex-col gap-y-6 w-full"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {allowPgBouncerSelection && (
                    <FormField_Shadcn_
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="horizontal"
                          label="Pooler Type"
                          description={
                            <>
                              {isChangingPoolerType && (
                                <Admonition
                                  type="warning"
                                  className="mt-2"
                                  title={poolerSwitchWarningTitle}
                                  description={poolerSwitchWarningDescription}
                                />
                              )}
                              {type === 'PgBouncer' && !hasIpv4Addon && (
                                <Admonition
                                  type="default"
                                  className="mt-2"
                                  title="The Dedicated Pooler does not support IPv4"
                                  description={
                                    <>
                                      If you were using Supavisor for IPv6, we recommend purchasing
                                      a dedicated IPv4 address from the{' '}
                                      <InlineLink
                                        href={`/project/${projectRef}/settings/addons?panel=ipv4`}
                                      >
                                        add-ons page
                                      </InlineLink>
                                      {isChangingPoolerType && ' before changing your pooler type'}.
                                    </>
                                  }
                                />
                              )}
                            </>
                          }
                        >
                          <Select_Shadcn_
                            {...field}
                            disabled={refetchPgBouncerStatus}
                            onValueChange={(e) => {
                              field.onChange(e)
                              if (e === 'Supavisor' && supavisorConfig) {
                                form.setValue('type', 'Supavisor')
                                form.setValue('pool_mode', supavisorConfig.pool_mode)
                                form.setValue(
                                  'default_pool_size',
                                  supavisorConfig.default_pool_size
                                )
                                form.setValue('max_client_conn', supavisorConfig.max_client_conn)
                              } else if (e === 'PgBouncer' && pgbouncerConfig) {
                                form.setValue('type', 'PgBouncer')
                                form.setValue('pool_mode', pgbouncerConfig.pool_mode as any)
                                form.setValue(
                                  'default_pool_size',
                                  pgbouncerConfig.default_pool_size as any
                                )
                                form.setValue(
                                  'max_client_conn',
                                  pgbouncerConfig.max_client_conn || null
                                )
                              }
                            }}
                          >
                            <FormControl_Shadcn_>
                              <SelectTrigger_Shadcn_ className="max-w-80">
                                <SelectValue_Shadcn_ />
                              </SelectTrigger_Shadcn_>
                            </FormControl_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectItem_Shadcn_ value="Supavisor">
                                <div className="flex gap-x-2 items-center">
                                  <p className="text-sm text-foreground">Supavisor</p>
                                  <Badge>IPv4</Badge>
                                </div>
                              </SelectItem_Shadcn_>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SelectItem_Shadcn_
                                    disabled={disablePgBouncerSelection}
                                    value="PgBouncer"
                                    className={cn(
                                      disablePgBouncerSelection && '!pointer-events-auto'
                                    )}
                                  >
                                    <div className="flex items-center gap-x-2">
                                      <p className="text-sm text-foreground">Dedicated Pooler</p>
                                      <div className="flex items-center gap-x-1">
                                        {hasIpv4Addon && <Badge>Dedicated IPv4</Badge>}
                                        <Badge>IPv6</Badge>
                                      </div>
                                    </div>
                                  </SelectItem_Shadcn_>
                                </TooltipTrigger>
                                {disablePgBouncerSelection && (
                                  <TooltipContent side="right" className="w-72">
                                    Dedicated Pooler can only be used while on a Micro Compute and
                                    above.{' '}
                                    {isFreePlan ? (
                                      <>
                                        <InlineLink
                                          href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}
                                        >
                                          Upgrade your plan
                                        </InlineLink>{' '}
                                        to adjust your project's compute size.
                                      </>
                                    ) : (
                                      <>
                                        Upgrade your compute size through your{' '}
                                        <InlineLink
                                          href={`/project/${projectRef}/settings/compute-and-disk`}
                                        >
                                          project's settings
                                        </InlineLink>
                                        .
                                      </>
                                    )}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  )}

                  {type === 'PgBouncer' && (
                    <FormField_Shadcn_
                      control={form.control}
                      name="pool_mode"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="horizontal"
                          label="Pool Mode"
                          description={
                            <>
                              {disablePoolModeSelection && (
                                <Alert_Shadcn_ className="mt-0">
                                  <AlertTitle_Shadcn_ className="text-foreground">
                                    Pool mode is permanently set to Transaction on port 6543
                                  </AlertTitle_Shadcn_>
                                  <AlertDescription_Shadcn_>
                                    You can use Session mode by connecting to the pooler on port
                                    5432 instead
                                  </AlertDescription_Shadcn_>
                                </Alert_Shadcn_>
                              )}
                              {showPoolModeWarning && (
                                <>
                                  {field.value === 'transaction' ? (
                                    <Admonition
                                      type="warning"
                                      title="Pool mode will be set to transaction permanently on port 6543"
                                      description="This will take into effect once saved. If you are using Session mode with port 6543 in your applications, please update to use port 5432 instead before saving."
                                    />
                                  ) : (
                                    <>
                                      <Panel.Notice
                                        layout="vertical"
                                        className="border rounded-lg"
                                        title="Deprecating Session Mode on Port 6543"
                                        description="On February 28, 2025, Supavisor is deprecating Session Mode on port 6543. Please update your application/database clients to use port 5432 for Session Mode."
                                        href="https://github.com/orgs/supabase/discussions/32755"
                                        buttonText="Read the announcement"
                                      />
                                      <Admonition
                                        className="mt-2"
                                        showIcon={false}
                                        type="default"
                                        title="Set to transaction mode to use both pooling modes concurrently"
                                        description="Session mode can be used concurrently with transaction mode by
                                                    using 5432 for session and 6543 for transaction. However, by
                                                    configuring the pooler mode to session here, you will not be able
                                                    to use transaction mode at the same time."
                                      />
                                    </>
                                  )}
                                </>
                              )}
                              <p className="mt-2">
                                Specify when a connection can be returned to the pool.{' '}
                                <span
                                  tabIndex={0}
                                  onClick={() => snap.setShowPoolingModeHelper(true)}
                                  className="transition cursor-pointer underline underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-foreground"
                                >
                                  Learn more about pool modes
                                </span>
                                .
                              </p>
                            </>
                          }
                        >
                          <FormControl_Shadcn_>
                            <Listbox
                              disabled={disablePoolModeSelection}
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
                        </FormItemLayout>
                      )}
                    />
                  )}

                  <FormField_Shadcn_
                    control={form.control}
                    name="default_pool_size"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="horizontal"
                        label="Pool Size"
                        description={
                          <>
                            <p>
                              The maximum number of connections made to the underlying Postgres
                              cluster, per user+db combination. Pool size has a default of{' '}
                              {defaultPoolSize} based on your compute size of {computeSize}.
                            </p>
                            {type === 'Supavisor' && (
                              <p className="mt-2">
                                Please refer to our{' '}
                                <InlineLink href="https://supabase.com/docs/guides/database/connection-management#configuring-supavisors-pool-size">
                                  documentation
                                </InlineLink>{' '}
                                to find out more.
                              </p>
                            )}
                          </>
                        }
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            className="w-full"
                            value={field.value || undefined}
                            placeholder={!field.value ? `${defaultPoolSize}` : ''}
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
                              The maximum number of concurrent client connections allowed.{' '}
                              {type === 'Supavisor' ? (
                                <>
                                  This value is fixed at {defaultMaxClientConn} based on your
                                  compute size of {computeSize} and cannot be changed.
                                </>
                              ) : (
                                <>
                                  This has a default of {defaultMaxClientConn} based on your compute
                                  size of {computeSize}.
                                </>
                              )}
                            </p>
                            {type === 'Supavisor' && (
                              <p className="mt-2">
                                Please refer to our{' '}
                                <InlineLink href="https://supabase.com/docs/guides/database/connection-management#configuring-supavisors-pool-size">
                                  documentation
                                </InlineLink>{' '}
                                to find out more.
                              </p>
                            )}
                          </>
                        }
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_
                            {...field}
                            type="number"
                            className="w-full"
                            value={field.value || ''}
                            disabled={type === 'Supavisor'}
                            placeholder={!field.value ? `${defaultMaxClientConn}` : ''}
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
            </>
          )}
        </Panel.Content>
      </Panel>
      <ConfirmationModal
        size="medium"
        visible={showConfirmation}
        loading={isSaving}
        title={`Confirm switching pooler type to ${formattedTargetPooler}`}
        confirmLabel="Confirm"
        onCancel={() => setShowConfirmation(false)}
        onConfirm={() => onSubmit(form.getValues())}
        alert={{
          base: { variant: 'warning' },
          title: poolerSwitchWarningTitle,
          description: poolerSwitchWarningDescription,
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you wish to switch your pooler type to {formattedTargetPooler} and apply the
          provided configurations?
        </p>
      </ConfirmationModal>
    </section>
  )
}
