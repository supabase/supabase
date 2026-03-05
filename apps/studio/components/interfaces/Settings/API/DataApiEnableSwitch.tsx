import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useCallback, useEffect, useReducer } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Card } from 'ui'

import { DataApiEnableSwitchForm } from './DataApiEnableSwitchForm'
import { DataApiEnableSwitchError, DataApiEnableSwitchLoading } from './DataApiEnableSwitchStates'
import { dataApiFormSchema, type DataApiFormValues } from './DataApiEnableSwitch.types'
import {
  enableCheckReducer,
  getDefaultSchemas,
  queryUnsafeEntitiesInApi,
} from './DataApiEnableSwitch.utils'
import { UnsafeEntitiesConfirmModal } from './UnsafeEntitiesConfirmModal'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from '@/data/config/project-postgrest-config-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

export const DataApiEnableSwitch = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { can: canUpdatePostgrestConfig, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.UPDATE, 'custom_config_postgrest')

  const {
    data: config,
    isError,
    isPending: isLoadingConfig,
  } = useProjectPostgrestConfigQuery({ projectRef })
  const { isEnabled, isPending: isEnabledCheckPending } = useIsDataApiEnabled({ projectRef })

  const { mutate: updatePostgrestConfig, isPending: isUpdating } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: (_data, variables) => {
        toast.success(variables.dbSchema ? 'Data API enabled' : 'Data API disabled')
      },
    })

  const [enableCheck, dispatchEnableCheck] = useReducer(enableCheckReducer, { status: 'idle' })

  const formId = 'data-api-enable-form'
  const isLoading = isLoadingConfig || !projectRef

  const form = useForm<DataApiFormValues>({
    resolver: zodResolver(dataApiFormSchema),
    mode: 'onChange',
    defaultValues: {
      enableDataApi: false,
    },
  })

  const syncForm = useStaticEffectEvent(() => {
    if (!isEnabledCheckPending) {
      form.reset({ enableDataApi: isEnabled })
    }
  })
  useEffect(() => {
    syncForm()
  }, [syncForm, isEnabled])

  const doUpdate = useCallback(
    (enableDataApi: boolean) => {
      if (!projectRef || !config) return

      const dbSchema = enableDataApi ? getDefaultSchemas(config.db_schema).join(', ') : ''

      updatePostgrestConfig({
        projectRef,
        dbSchema,
        maxRows: config.max_rows,
        dbExtraSearchPath: config.db_extra_search_path ?? '',
        dbPool: config.db_pool ?? null,
      })
    },
    [projectRef, config, updatePostgrestConfig]
  )

  const onSubmit = useCallback(
    async ({ enableDataApi }: DataApiFormValues) => {
      if (!projectRef) return

      if (!enableDataApi || isEnabled) {
        doUpdate(enableDataApi)
        return
      }

      // Enabling — check for entities with security issues in the target schemas
      const targetSchemas = getDefaultSchemas(config?.db_schema)

      dispatchEnableCheck({ type: 'START_CHECK' })
      try {
        const entities = await queryUnsafeEntitiesInApi({
          projectRef,
          connectionString: project?.connectionString,
          schemas: targetSchemas,
        })

        if (entities.length > 0) {
          dispatchEnableCheck({ type: 'ENTITIES_FOUND', unsafeEntities: entities })
        } else {
          dispatchEnableCheck({ type: 'DISMISS' })
          doUpdate(true)
        }
      } catch (error) {
        console.error('Failed to check for exposed entities', error)
        dispatchEnableCheck({ type: 'DISMISS' })
        toast.error('Failed to check for exposed entities')
      }
    },
    [projectRef, isEnabled, config?.db_schema, project?.connectionString, doUpdate]
  )

  const handleReset = useCallback(() => {
    if (isEnabledCheckPending) return
    form.reset({ enableDataApi: isEnabled })
  }, [isEnabledCheckPending, isEnabled, form])

  const isBusy = isUpdating || enableCheck.status === 'checking'
  const disabled = !canUpdatePostgrestConfig || isBusy
  const permissionsHelper =
    isPermissionsLoaded && !canUpdatePostgrestConfig
      ? "You need additional permissions to update your project's API settings"
      : undefined

  const cardContent = isLoading ? (
    <DataApiEnableSwitchLoading />
  ) : isError || !config ? (
    <DataApiEnableSwitchError />
  ) : (
    <DataApiEnableSwitchForm
      form={form}
      formId={formId}
      disabled={disabled}
      isBusy={isBusy}
      permissionsHelper={permissionsHelper}
      onSubmit={onSubmit}
      handleReset={handleReset}
    />
  )

  return (
    <>
      <Card>{cardContent}</Card>

      <UnsafeEntitiesConfirmModal
        visible={enableCheck.status === 'confirming'}
        loading={isUpdating}
        unsafeEntities={enableCheck.status === 'confirming' ? enableCheck.unsafeEntities : []}
        onCancel={() => dispatchEnableCheck({ type: 'DISMISS' })}
        onConfirm={() => {
          dispatchEnableCheck({ type: 'DISMISS' })
          doUpdate(true)
        }}
      />
    </>
  )
}
