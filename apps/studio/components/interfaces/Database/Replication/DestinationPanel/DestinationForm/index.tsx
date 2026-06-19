import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, DialogSectionSeparator, Form, SheetFooter, SheetSection } from 'ui'
import * as z from 'zod'

import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '../../useIsETLPrivateAlpha'
import { DestinationType } from '../DestinationPanel.types'
import { AdvancedSettings } from './AdvancedSettings'
import { getAnalyticsBucketValidationIssues } from './AnalyticsBucket/AnalyticsBucket.utils'
import { AnalyticsBucketFields } from './AnalyticsBucket/Fields'
import { getBigQueryValidationIssues } from './BigQuery/BigQuery.utils'
import { BigQueryFields } from './BigQuery/Fields'
import { CREATE_NEW_NAMESPACE } from './DestinationForm.constants'
import { DestinationPanelFormSchema as FormSchema } from './DestinationForm.schema'
import {
  areValidationFailuresEqual,
  buildDestinationConfig,
  buildDestinationConfigForValidation,
  generateDefaultValues,
} from './DestinationForm.utils'
import { DestinationNameInput } from './DestinationNameInput'
import { getDucklakeValidationIssues } from './DuckLake/DuckLake.utils'
import { DuckLakeFields } from './DuckLake/Fields'
import { NewPublicationPanel } from './NewPublicationPanel'
import { NoDestinationsAvailable } from './NoDestinationsAvailable'
import { PublicationSelection } from './PublicationSelection'
import { SnowflakeFields } from './Snowflake/Fields'
import { getSnowflakeValidationIssues } from './Snowflake/Snowflake.utils'
import { ValidationFailuresSection } from './ValidationFailuresSection'
import { ValidationWarningsDialog } from './ValidationWarningsDialog'
import { CreateAnalyticsBucketSheet } from '@/components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import {
  BatchConfig,
  useCreateDestinationPipelineMutation,
} from '@/data/replication/create-destination-pipeline-mutation'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import { useReplicationPublicationsQuery } from '@/data/replication/publications-query'
import { useRestartPipelineHelper } from '@/data/replication/restart-pipeline-helper'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useStartPipelineMutation } from '@/data/replication/start-pipeline-mutation'
import { useUpdateDestinationPipelineMutation } from '@/data/replication/update-destination-pipeline-mutation'
import {
  useValidateDestinationMutation,
  type ValidationFailure,
} from '@/data/replication/validate-destination-mutation'
import { useValidatePipelineMutation } from '@/data/replication/validate-pipeline-mutation'
import { useIcebergNamespaceCreateMutation } from '@/data/storage/iceberg-namespace-create-mutation'
import { useS3AccessKeyCreateMutation } from '@/data/storage/s3-access-key-create-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { type ResponseError } from '@/types'

const formId = 'destination-editor'

interface DestinationFormProps {
  selectedType: DestinationType
  visible: boolean
  existingDestination?: {
    sourceId?: number
    destinationId: number
    pipelineId?: number
    enabled: boolean
    statusName?: string
  }
  onClose: () => void
}

export const DestinationForm = ({
  selectedType,
  visible,
  existingDestination,
  onClose,
}: DestinationFormProps) => {
  const { ref: projectRef } = useParams()
  const { setRequestStatus } = usePipelineRequestStatus()

  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const [isFormInteracting, setIsFormInteracting] = useState(false)
  const [showValidationWarningsDialog, setShowValidationWarningsDialog] = useState(false)
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)
  const [newBucketSheetVisible, setNewBucketSheetVisible] = useState(false)
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof FormSchema> | null>(
    null
  )
  const [hasRunValidation, setHasRunValidation] = useState(false)
  const [destinationValidationFailures, setDestinationValidationFailures] = useState<
    ValidationFailure[]
  >([])
  const [pipelineValidationFailures, setPipelineValidationFailures] = useState<ValidationFailure[]>(
    []
  )

  const validationSectionRef = useRef<HTMLDivElement>(null)

  const editMode = !!existingDestination

  // Compute available destinations based on feature flags
  const availableDestinations = useMemo(() => {
    const destinations = []
    if (etlEnableBigQuery) destinations.push({ value: 'BigQuery', label: 'BigQuery' })
    if (etlEnableIceberg)
      destinations.push({ value: 'Analytics Bucket', label: 'Analytics Bucket' })
    if (etlEnableDucklake) destinations.push({ value: 'DuckLake', label: 'DuckLake' })
    if (etlEnableSnowflake) destinations.push({ value: 'Snowflake', label: 'Snowflake' })
    return destinations
  }, [etlEnableBigQuery, etlEnableDucklake, etlEnableIceberg, etlEnableSnowflake])
  const hasNoAvailableDestinations = availableDestinations.length === 0

  const { data: sourcesData } = useReplicationSourcesQuery({ projectRef })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id

  const {
    data: publications = [],
    isSuccess: isSuccessPublications,
    refetch: refetchPublications,
  } = useReplicationPublicationsQuery({ projectRef, sourceId })

  const { data: destinationData } = useReplicationDestinationByIdQuery({
    projectRef,
    destinationId: existingDestination?.destinationId,
  })

  const { data: pipelineData } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId: existingDestination?.pipelineId,
  })

  const { data: apiKeysData } = useAPIKeys(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey } = apiKeysData ?? {}

  const catalogToken = serviceKey?.api_key ?? ''

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const { mutateAsync: createDestinationPipeline, isPending: creatingDestinationPipeline } =
    useCreateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
      onError: () => {},
    })

  const { mutateAsync: updateDestinationPipeline, isPending: updatingDestinationPipeline } =
    useUpdateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
      onError: () => {},
    })

  const { mutateAsync: startPipeline, isPending: startingPipeline } = useStartPipelineMutation()
  const { restartPipeline } = useRestartPipelineHelper()

  const { mutateAsync: createS3AccessKey, isPending: isCreatingS3AccessKey } =
    useS3AccessKeyCreateMutation()

  const { mutateAsync: createNamespace, isPending: isCreatingNamespace } =
    useIcebergNamespaceCreateMutation()

  const { mutateAsync: validateDestination, isPending: isValidatingDestination } =
    useValidateDestinationMutation()

  const { mutateAsync: validatePipeline, isPending: isValidatingPipeline } =
    useValidatePipelineMutation()

  const isValidating = isValidatingDestination || isValidatingPipeline

  const defaultValues = useMemo(
    () =>
      generateDefaultValues({
        destinationData,
        pipelineData,
        catalogToken,
        region: projectSettings?.region,
        projectRef,
        editMode,
      }),
    [destinationData, pipelineData, catalogToken, projectSettings, projectRef, editMode]
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(
      FormSchema.superRefine((data, ctx) => {
        const addRequiredFieldError = (path: string, message: string) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: [path],
          })
        }

        if (selectedType === 'BigQuery') {
          getBigQueryValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'Analytics Bucket') {
          getAnalyticsBucketValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'DuckLake') {
          getDucklakeValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        } else if (selectedType === 'Snowflake') {
          getSnowflakeValidationIssues(data).forEach(({ path, message }) => {
            addRequiredFieldError(path, message)
          })
        }
      })
    ),
    defaultValues,
  })

  const { publicationName, warehouseName } = form.watch()

  const publicationNames = useMemo(() => publications?.map((pub) => pub.name) ?? [], [publications])
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)

  const allValidationFailures = [...destinationValidationFailures, ...pipelineValidationFailures]
  const hasValidationFailures = allValidationFailures.some((f) => f.failure_type === 'critical')
  const validationWarnings = allValidationFailures.filter((f) => f.failure_type === 'warning')

  const isSaving =
    creatingDestinationPipeline ||
    updatingDestinationPipeline ||
    startingPipeline ||
    isCreatingS3AccessKey ||
    isCreatingNamespace ||
    isValidating

  const isSubmitDisabled =
    isSaving || isSelectedPublicationMissing || (!editMode && hasNoAvailableDestinations)

  const getSubmitButtonText = () => {
    if (editMode) {
      return existingDestination?.enabled ? 'Apply and restart' : 'Apply and start'
    } else {
      if (hasRunValidation && validationWarnings.length > 0 && !hasValidationFailures) {
        return 'Create and start anyway'
      }

      return 'Create and start'
    }
  }

  // Helper function to handle namespace creation if needed
  const resolveNamespace = async (data: z.infer<typeof FormSchema>) => {
    if (data.namespace === CREATE_NEW_NAMESPACE) {
      if (!data.newNamespaceName) throw new Error('New namespace name is required')

      await createNamespace({
        projectRef,
        warehouse: data.warehouseName!,
        namespace: data.newNamespaceName,
      })

      return data.newNamespaceName
    }
    return data.namespace
  }

  // Helper function to validate configuration
  const validateConfiguration = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef || !sourceId) return { canContinue: false, warnings: [] }

    setHasRunValidation(true)

    // Call both validation endpoints in parallel and wait for both to complete
    // even if one fails - this makes the validation feel like a single operation
    const results = await Promise.allSettled([
      validateDestination({
        projectRef,
        destinationConfig: buildDestinationConfigForValidation({ projectRef, selectedType, data }),
        sourceId,
        publicationName: data.publicationName,
        maxFillMs: data.maxFillMs,
        maxTableSyncWorkers: data.maxTableSyncWorkers,
        maxCopyConnectionsPerTable: data.maxCopyConnectionsPerTable,
        invalidatedSlotBehavior: data.invalidatedSlotBehavior,
      }),
      validatePipeline({
        projectRef,
        sourceId,
        publicationName: data.publicationName,
        maxFillMs: data.maxFillMs,
        maxTableSyncWorkers: data.maxTableSyncWorkers,
        maxCopyConnectionsPerTable: data.maxCopyConnectionsPerTable,
        invalidatedSlotBehavior: data.invalidatedSlotBehavior,
      }),
    ])

    // Extract results from settled promises
    const destResult = results[0]
    const pipelineResult = results[1]

    // Check if any validation request failed completely
    const hasRequestError = results.some((r) => r.status === 'rejected')

    if (hasRequestError) {
      // If any request failed, surface the upstream message so users see why
      const rejected = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      const reason =
        rejected?.reason instanceof Error ? rejected.reason.message : 'Please try again.'
      toast.error(`Failed to validate configuration: ${reason}`)
      setHasRunValidation(false)
      return { canContinue: false, warnings: [] }
    }

    // Both requests succeeded, extract validation failures
    const destValidationResult =
      destResult.status === 'fulfilled' ? destResult.value : { validation_failures: [] }
    const pipelineValidationResult =
      pipelineResult.status === 'fulfilled' ? pipelineResult.value : { validation_failures: [] }

    setDestinationValidationFailures(destValidationResult.validation_failures)
    setPipelineValidationFailures(pipelineValidationResult.validation_failures)

    // Check if there are critical failures or warnings
    const allFailures = [
      ...destValidationResult.validation_failures,
      ...pipelineValidationResult.validation_failures,
    ]
    const hasCriticalFailures = allFailures.some((f) => f.failure_type === 'critical')
    const hasAnyFailures = allFailures.length > 0
    const warnings = allFailures.filter((f) => f.failure_type === 'warning')

    // Scroll to validation section so the user sees failures (both critical and warnings) inline
    if (hasAnyFailures) {
      setTimeout(() => {
        validationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }

    return { canContinue: !hasCriticalFailures, warnings }
  }

  const submitPipeline = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return console.error('Source id is required')
    if (isSelectedPublicationMissing) {
      return toast.error('Please select another publication before continuing')
    }

    try {
      const destinationConfig = await buildDestinationConfig({
        projectRef,
        selectedType,
        warehouseName,
        data,
        createS3AccessKey,
        resolveNamespace,
      })

      if (!destinationConfig) throw new Error('Destination configuration is missing')

      const batchConfig: BatchConfig | undefined =
        data.maxFillMs !== undefined ? { maxFillMs: data.maxFillMs } : undefined
      const hasBatchFields = batchConfig !== undefined

      const pipelineConfig = {
        publicationName: data.publicationName,
        maxTableSyncWorkers: data.maxTableSyncWorkers,
        maxCopyConnectionsPerTable: data.maxCopyConnectionsPerTable,
        invalidatedSlotBehavior: data.invalidatedSlotBehavior,
        ...(hasBatchFields ? { batch: batchConfig } : {}),
      }

      if (editMode && existingDestination) {
        if (!existingDestination.pipelineId) return console.error('Pipeline id is required')

        await updateDestinationPipeline({
          destinationId: existingDestination.destinationId,
          pipelineId: existingDestination.pipelineId,
          projectRef,
          destinationName: data.name,
          destinationConfig,
          pipelineConfig,
          sourceId,
        })
        // Set request status only right before starting, then fire and close
        const snapshot =
          existingDestination.statusName ?? (existingDestination.enabled ? 'started' : 'stopped')
        if (existingDestination.enabled) {
          setRequestStatus(
            existingDestination.pipelineId,
            PipelineStatusRequestStatus.RestartRequested,
            snapshot
          )
          toast.success('Settings applied. Restarting the pipeline...')
          restartPipeline({ projectRef, pipelineId: existingDestination.pipelineId })
        } else {
          setRequestStatus(
            existingDestination.pipelineId,
            PipelineStatusRequestStatus.StartRequested,
            snapshot
          )
          toast.success('Settings applied. Starting the pipeline...')
          startPipeline({ projectRef, pipelineId: existingDestination.pipelineId })
        }
        onClose()
      } else {
        const { pipeline_id: pipelineId } = await createDestinationPipeline({
          projectRef,
          destinationName: data.name,
          destinationConfig,
          pipelineConfig,
          sourceId,
        })
        // Set request status only right before starting, then fire and close
        setRequestStatus(pipelineId, PipelineStatusRequestStatus.StartRequested, undefined)
        toast.success('Destination created. Starting the pipeline...')
        startPipeline({ projectRef, pipelineId })
        onClose()
      }
    } catch (error) {
      const action = editMode ? 'apply and run' : 'create and start'
      toast.error(`Failed to ${action} destination: ${(error as ResponseError).message}`)
    }
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!editMode) {
      const previousValidationFailures = allValidationFailures
      const previousWarnings = previousValidationFailures.filter(
        (f) => f.failure_type === 'warning'
      )
      const previousFailuresAreOnlyWarnings =
        hasRunValidation &&
        previousValidationFailures.length > 0 &&
        previousValidationFailures.every((f) => f.failure_type === 'warning')

      const validationResult = await validateConfiguration(data)
      if (!validationResult.canContinue) {
        // Critical failures shown inline — stop so user can fix them
        return
      }

      const hasWarnings = validationResult.warnings.length > 0
      const warningsUnchanged =
        previousFailuresAreOnlyWarnings &&
        areValidationFailuresEqual(previousWarnings, validationResult.warnings)

      // Open the confirmation dialog when validation is clean, or when warnings are unchanged on
      // resubmit. New/changed warnings are shown inline so the user can review and submit again.
      if (hasWarnings) {
        if (warningsUnchanged) {
          setPendingFormValues(data)
          setShowValidationWarningsDialog(true)
        }
        return
      }
    }

    await submitPipeline(data)
  }

  const handleValidationWarningsDialogChange = (open: boolean) => {
    setShowValidationWarningsDialog(open)
    if (!open) {
      setPendingFormValues(null)
    }
  }

  const handleValidationWarningsConfirm = async () => {
    if (!pendingFormValues) return

    const values = pendingFormValues
    setPendingFormValues(null)
    setShowValidationWarningsDialog(false)
    await submitPipeline(values)
  }

  useEffect(() => {
    if (editMode && destinationData && pipelineData && !isFormInteracting) {
      form.reset(defaultValues)
    }
  }, [destinationData, pipelineData, editMode, defaultValues, form, isFormInteracting])

  // Ensure the form always reflects the freshest data whenever the panel opens
  useEffect(() => {
    if (visible) {
      form.reset(defaultValues)
      setIsFormInteracting(false)
      setHasRunValidation(false)
      setDestinationValidationFailures([])
      setPipelineValidationFailures([])
    }
  }, [visible, defaultValues, form])

  useEffect(() => {
    if (visible && projectRef && sourceId) {
      refetchPublications()
    }
  }, [visible, projectRef, sourceId, refetchPublications])

  return (
    <>
      <SheetSection className="grow overflow-auto px-0 py-0">
        {hasNoAvailableDestinations && !editMode ? (
          <NoDestinationsAvailable />
        ) : (
          <Form {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-5 flex flex-col gap-y-6">
                <p className="text-sm font-medium text-foreground">Destination details</p>

                <div className="space-y-4">
                  <DestinationNameInput form={form} />
                  <PublicationSelection
                    form={form}
                    sourceId={sourceId}
                    visible={visible}
                    onSelectNewPublication={() => setPublicationPanelVisible(true)}
                  />
                </div>
              </div>

              <DialogSectionSeparator />

              {selectedType === 'BigQuery' && etlEnableBigQuery ? (
                <BigQueryFields form={form} />
              ) : selectedType === 'Analytics Bucket' && etlEnableIceberg ? (
                <AnalyticsBucketFields
                  form={form}
                  setIsFormInteracting={setIsFormInteracting}
                  onSelectNewBucket={() => setNewBucketSheetVisible(true)}
                />
              ) : selectedType === 'DuckLake' && etlEnableDucklake ? (
                <DuckLakeFields form={form} editMode={editMode} />
              ) : selectedType === 'Snowflake' && etlEnableSnowflake ? (
                <SnowflakeFields form={form} />
              ) : null}

              <DialogSectionSeparator />

              <AdvancedSettings type={selectedType} form={form} />

              {!editMode && hasRunValidation && !isValidating && (
                <>
                  <DialogSectionSeparator />

                  <div ref={validationSectionRef}>
                    <ValidationFailuresSection
                      destinationFailures={destinationValidationFailures}
                      pipelineFailures={pipelineValidationFailures}
                    />
                  </div>
                </>
              )}
            </form>
          </Form>
        )}
      </SheetSection>

      <SheetFooter className="justify-between!">
        <AnimatePresence mode="wait">
          {isValidating || isSaving ? (
            <motion.div
              className="flex items-center gap-x-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Loader2 className="animate-spin" size={14} />
              <p className="text-foreground-light text-sm">
                {isValidating
                  ? 'Validating destination configuration...'
                  : `${editMode ? 'Updating' : 'Creating'} destination...`}
              </p>
            </motion.div>
          ) : (
            <div />
          )}
        </AnimatePresence>
        <div className="flex items-center gap-x-2">
          <Button disabled={isSaving} variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitDisabled} loading={isSaving} form={formId} type="submit">
            {getSubmitButtonText()}
          </Button>
        </div>
      </SheetFooter>

      <NewPublicationPanel
        sourceId={sourceId}
        visible={publicationPanelVisible}
        onClose={() => setPublicationPanelVisible(false)}
      />

      <CreateAnalyticsBucketSheet
        open={newBucketSheetVisible}
        onOpenChange={setNewBucketSheetVisible}
      />

      <ValidationWarningsDialog
        open={showValidationWarningsDialog}
        onOpenChange={handleValidationWarningsDialogChange}
        isLoading={isSaving}
        warningCount={validationWarnings.length}
        onConfirm={handleValidationWarningsConfirm}
      />
    </>
  )
}
