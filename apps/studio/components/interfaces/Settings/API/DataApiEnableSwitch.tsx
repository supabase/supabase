import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import { useEffect, useReducer } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { z } from 'zod'

import { DataApiDisabledAlert } from './DataApiDisabledAlert'
import {
  getDefaultSchemas,
  queryUnsafeEntitiesInApi,
  type ExposedEntity,
} from './DataApiEnableSwitch.utils'
import { UnsafeEntitiesConfirmModal } from './UnsafeEntitiesConfirmModal'
import { FormActions } from '@/components/ui/Forms/FormActions'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from '@/data/config/project-postgrest-config-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'

const dataApiFormSchema = z.object({
  enableDataApi: z.boolean(),
})

type DataApiFormValues = z.infer<typeof dataApiFormSchema>

type EnableCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'confirming'; unsafeEntities: Array<ExposedEntity> }

type EnableCheckAction =
  | { type: 'START_CHECK' }
  | { type: 'ENTITIES_FOUND'; unsafeEntities: Array<ExposedEntity> }
  | { type: 'DISMISS' }

function enableCheckReducer(state: EnableCheckState, action: EnableCheckAction): EnableCheckState {
  switch (state.status) {
    case 'idle':
      if (action.type === 'START_CHECK') return { status: 'checking' }
      return state
    case 'checking':
      if (action.type === 'ENTITIES_FOUND')
        return { status: 'confirming', unsafeEntities: action.unsafeEntities }
      if (action.type === 'DISMISS') return { status: 'idle' }
      return state
    case 'confirming':
      if (action.type === 'DISMISS') return { status: 'idle' }
      return state
  }
}

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

  const doUpdate = (enableDataApi: boolean) => {
    if (!projectRef || !config) return

    const dbSchema = enableDataApi ? getDefaultSchemas(config.db_schema).join(', ') : ''

    updatePostgrestConfig({
      projectRef,
      dbSchema,
      maxRows: config.max_rows,
      dbExtraSearchPath: config.db_extra_search_path ?? '',
      dbPool: config.db_pool ?? null,
    })
  }

  const onSubmit = async ({ enableDataApi }: DataApiFormValues) => {
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
  }

  const handleReset = () => {
    if (isEnabledCheckPending) return
    form.reset({ enableDataApi: isEnabled })
  }

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

const DataApiEnableSwitchLoading = () => (
  <CardContent className="space-y-2">
    <ShimmeringLoader />
    <ShimmeringLoader className="w-3/4" delayIndex={1} />
  </CardContent>
)

const DataApiEnableSwitchError = () => (
  <Alert_Shadcn_ variant="destructive">
    <AlertCircle size={16} />
    <AlertTitle_Shadcn_>Failed to retrieve Data API settings</AlertTitle_Shadcn_>
  </Alert_Shadcn_>
)

const DataApiEnableSwitchForm = ({
  form,
  formId,
  disabled,
  isBusy,
  permissionsHelper,
  onSubmit,
  handleReset,
}: {
  form: ReturnType<typeof useForm<DataApiFormValues>>
  formId: string
  disabled: boolean
  isBusy: boolean
  permissionsHelper: string | undefined
  onSubmit: (values: DataApiFormValues) => void
  handleReset: () => void
}) => {
  const watchedEnabled = form.watch('enableDataApi')

  return (
    <Form_Shadcn_ {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent>
          <FormField_Shadcn_
            control={form.control}
            name="enableDataApi"
            render={({ field }) => (
              <FormItem_Shadcn_ className="space-y-4">
                <FormItemLayout
                  layout="flex-row-reverse"
                  label="Enable Data API"
                  description="When enabled you will be able to use any Supabase client library and PostgREST endpoints with any schema configured in the Settings tab."
                >
                  <FormControl_Shadcn_>
                    <Switch
                      size="large"
                      disabled={disabled}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>

                {!watchedEnabled && <DataApiDisabledAlert />}
              </FormItem_Shadcn_>
            )}
          />
        </CardContent>
        <CardFooter>
          <FormActions
            form={formId}
            isSubmitting={isBusy}
            hasChanges={form.formState.isDirty}
            handleReset={handleReset}
            disabled={disabled}
            helper={permissionsHelper}
          />
        </CardFooter>
      </form>
    </Form_Shadcn_>
  )
}
