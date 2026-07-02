import { useParams } from 'common'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'

import { type DestinationType, type ExistingDestination } from '../DestinationPanel.types'
import { CREATE_NEW_NAMESPACE } from './DestinationForm.constants'
import { DestinationPanelFormSchema as FormSchema } from './DestinationForm.schema'
import {
  buildDestinationConfig,
  buildDestinationConfigForValidation,
} from './DestinationForm.utils'
import {
  useCreateDestinationPipelineMutation,
  type BatchConfig,
} from '@/data/replication/create-destination-pipeline-mutation'
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
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { type ResponseError } from '@/types'

export const useDestinationForm = ({ selectedType }: { selectedType: DestinationType }) => {
  const { ref: projectRef } = useParams()
  const { setRequestStatus } = usePipelineRequestStatus()
  const { restartPipeline } = useRestartPipelineHelper()

  const [hasRunValidation, setHasRunValidation] = useState(false)
  const [destinationValidationFailures, setDestinationValidationFailures] = useState<
    ValidationFailure[]
  >([])
  const [pipelineValidationFailures, setPipelineValidationFailures] = useState<ValidationFailure[]>(
    []
  )

  const { data: sourcesData } = useReplicationSourcesQuery({ projectRef })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id

  const { mutateAsync: validateDestination, isPending: isValidatingDestination } =
    useValidateDestinationMutation()

  const { mutateAsync: validatePipeline, isPending: isValidatingPipeline } =
    useValidatePipelineMutation()

  const { mutateAsync: createS3AccessKey, isPending: isCreatingS3AccessKey } =
    useS3AccessKeyCreateMutation()

  const { mutateAsync: createNamespace, isPending: isCreatingNamespace } =
    useIcebergNamespaceCreateMutation()

  const { mutateAsync: createDestinationPipeline, isPending: creatingDestinationPipeline } =
    useCreateDestinationPipelineMutation({
      onError: () => {},
    })

  const { mutateAsync: updateDestinationPipeline, isPending: updatingDestinationPipeline } =
    useUpdateDestinationPipelineMutation({
      onError: () => {},
    })

  const { mutateAsync: startPipeline, isPending: startingPipeline } = useStartPipelineMutation()

  const isValidating = isValidatingDestination || isValidatingPipeline

  const isSaving =
    creatingDestinationPipeline ||
    updatingDestinationPipeline ||
    startingPipeline ||
    isCreatingS3AccessKey ||
    isCreatingNamespace ||
    isValidating

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

  const resetValidation = useCallback(() => {
    setHasRunValidation(false)
    setDestinationValidationFailures([])
    setPipelineValidationFailures([])
  }, [])

  // Helper function to validate configuration
  const validateConfiguration = async ({
    data,
    onValidationFail,
  }: {
    data: z.infer<typeof FormSchema>
    onValidationFail: () => void
  }) => {
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

    if (hasAnyFailures) onValidationFail()

    return { canContinue: !hasCriticalFailures, warnings }
  }

  const submitPipeline = async ({
    data,
    existingDestination,
    onSuccess,
    onClose,
  }: {
    data: z.infer<typeof FormSchema>
    existingDestination?: ExistingDestination
    onSuccess: () => void
    onClose: () => void
  }) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return console.error('Source id is required')

    const editMode = !!existingDestination

    try {
      const destinationConfig = await buildDestinationConfig({
        projectRef,
        selectedType,
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

        await updateDestinationPipeline(
          {
            destinationId: existingDestination.destinationId,
            pipelineId: existingDestination.pipelineId,
            projectRef,
            destinationName: data.name,
            destinationConfig,
            pipelineConfig,
            sourceId,
          },
          { onSuccess }
        )

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
        const { pipeline_id: pipelineId } = await createDestinationPipeline(
          {
            projectRef,
            destinationName: data.name,
            destinationConfig,
            pipelineConfig,
            sourceId,
          },
          { onSuccess }
        )
        // Set request status only right before starting, then fire and close
        setRequestStatus(pipelineId, PipelineStatusRequestStatus.StartRequested, undefined)
        toast.success('Pipeline created. Starting the pipeline...')
        startPipeline({ projectRef, pipelineId })
        onClose()
      }
    } catch (error) {
      const action = editMode
        ? existingDestination?.enabled
          ? 'apply changes and restart pipeline'
          : 'apply changes and start pipeline'
        : 'create and start pipeline'
      toast.error(`Failed to ${action}: ${(error as ResponseError).message}`)
    }
  }

  return {
    isValidating,
    validateConfiguration,
    isSaving,
    submitPipeline,
    hasRunValidation,
    destinationValidationFailures,
    pipelineValidationFailures,
    resetValidation,
  }
}
