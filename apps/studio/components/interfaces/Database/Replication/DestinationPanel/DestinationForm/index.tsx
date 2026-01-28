import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import { CreateAnalyticsBucketSheet } from 'components/interfaces/Storage/AnalyticsBuckets/CreateAnalyticsBucketSheet'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import {
  BatchConfig,
  BigQueryDestinationConfig,
  DestinationConfig,
  IcebergDestinationConfig,
  useCreateDestinationPipelineMutation,
} from 'data/replication/create-destination-pipeline-mutation'
import { useReplicationDestinationByIdQuery } from 'data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useRestartPipelineHelper } from 'data/replication/restart-pipeline-helper'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useUpdateDestinationPipelineMutation } from 'data/replication/update-destination-pipeline-mutation'
import {
  type ValidationFailure,
  useValidateDestinationMutation,
} from 'data/replication/validate-destination-mutation'
import { useValidatePipelineMutation } from 'data/replication/validate-pipeline-mutation'
import { useIcebergNamespaceCreateMutation } from 'data/storage/iceberg-namespace-create-mutation'
import { useS3AccessKeyCreateMutation } from 'data/storage/s3-access-key-create-mutation'
import { AnimatePresence, motion } from 'framer-motion'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { snakeCase } from 'lodash'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import { Button, DialogSectionSeparator, Form_Shadcn_, SheetFooter, SheetSection } from 'ui'
import * as z from 'zod'

import { DestinationType } from '../DestinationPanel.types'
import { AdvancedSettings } from './AdvancedSettings'
import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from './DestinationForm.constants'
import { DestinationPanelFormSchema as FormSchema } from './DestinationForm.schema'
import { buildDestinationConfigForValidation } from './DestinationForm.utils'
import { DestinationNameInput } from './DestinationNameInput'
import { AnalyticsBucketFields, BigQueryFields } from './DestinationPanelFields'
import { NewPublicationPanel } from './NewPublicationPanel'
import { NoDestinationsAvailable } from './NoDestinationsAvailable'
import { PublicationSelection } from './PublicationSelection'
import { ReplicationDisclaimerDialog } from './ReplicationDisclaimerDialog'
import { ValidationFailuresSection } from './ValidationFailuresSection'

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

  const etlEnableBigQuery = useFlag('etlEnableBigQuery')
  const etlEnableIceberg = useFlag('etlEnableIceberg')
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const [isFormInteracting, setIsFormInteracting] = useState(false)
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)
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
    return destinations
  }, [etlEnableBigQuery, etlEnableIceberg])
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

  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey } = getKeys(apiKeys)
  const catalogToken = serviceKey?.api_key ?? ''

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const { mutateAsync: createDestinationPipeline, isPending: creatingDestinationPipeline } =
    useCreateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
    })

  const { mutateAsync: updateDestinationPipeline, isPending: updatingDestinationPipeline } =
    useUpdateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
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

  const defaultValues = useMemo(() => {
    const config = destinationData?.config
    const isBigQueryConfig = config && 'big_query' in config
    const isIcebergConfig = config && 'iceberg' in config

    return {
      // Common fields
      name: destinationData?.name ?? '',
      publicationName: pipelineData?.config.publication_name ?? '',
      maxFillMs: pipelineData?.config?.batch?.max_fill_ms ?? undefined,
      maxSize: pipelineData?.config?.batch?.max_size ?? undefined,
      maxTableSyncWorkers: pipelineData?.config?.max_table_sync_workers ?? undefined,
      // BigQuery fields
      projectId: isBigQueryConfig ? config.big_query.project_id : '',
      datasetId: isBigQueryConfig ? config.big_query.dataset_id : '',
      serviceAccountKey: isBigQueryConfig ? config.big_query.service_account_key : '',
      maxStalenessMins: isBigQueryConfig ? config.big_query.max_staleness_mins : undefined, // Default: null
      // Analytics Bucket fields
      warehouseName: isIcebergConfig ? config.iceberg.supabase.warehouse_name : '',
      namespace: isIcebergConfig ? config.iceberg.supabase.namespace : '',
      newNamespaceName: '',
      catalogToken: isIcebergConfig ? config.iceberg.supabase.catalog_token : catalogToken,
      s3AccessKeyId: isIcebergConfig ? config.iceberg.supabase.s3_access_key_id : '',
      s3SecretAccessKey: isIcebergConfig ? config.iceberg.supabase.s3_secret_access_key : '',
      s3Region:
        projectSettings?.region ?? (isIcebergConfig ? config.iceberg.supabase.s3_region : ''),
    }
  }, [destinationData, pipelineData, catalogToken, projectSettings])

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
          if (!data.projectId?.length) addRequiredFieldError('projectId', 'Project ID is required')
          if (!data.datasetId?.length) addRequiredFieldError('datasetId', 'Dataset ID is required')
          if (!data.serviceAccountKey?.length)
            addRequiredFieldError('serviceAccountKey', 'Service Account Key is required')
        } else if (selectedType === 'Analytics Bucket') {
          if (!data.warehouseName?.length)
            addRequiredFieldError('warehouseName', 'Bucket is required')

          const hasValidNamespace =
            (data.namespace?.length && data.namespace !== 'create-new-namespace') ||
            (data.namespace === 'create-new-namespace' && data.newNamespaceName?.length)

          if (!hasValidNamespace) {
            const isCreatingNew = data.namespace === 'create-new-namespace'
            addRequiredFieldError(
              isCreatingNew ? 'newNamespaceName' : 'namespace',
              isCreatingNew ? 'Namespace name is required' : 'Namespace is required'
            )
          }

          if (!data.s3Region?.length) addRequiredFieldError('s3Region', 'S3 Region is required')

          if (!data.s3AccessKeyId?.length)
            addRequiredFieldError('s3AccessKeyId', 'S3 Access Key ID is required')

          if (data.s3AccessKeyId !== 'create-new' && !data.s3SecretAccessKey?.length) {
            addRequiredFieldError('s3SecretAccessKey', 'S3 Secret Access Key is required')
          }
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
    if (!projectRef || !sourceId) return false

    setHasRunValidation(true)

    // Call both validation endpoints in parallel and wait for both to complete
    // even if one fails - this makes the validation feel like a single operation
    const results = await Promise.allSettled([
      validateDestination({
        projectRef,
        destinationConfig: buildDestinationConfigForValidation({ projectRef, selectedType, data }),
      }),
      validatePipeline({
        projectRef,
        sourceId,
        publicationName: data.publicationName,
        maxFillMs: data.maxFillMs,
        maxSize: data.maxSize,
        maxTableSyncWorkers: data.maxTableSyncWorkers,
      }),
    ])

    // Extract results from settled promises
    const destResult = results[0]
    const pipelineResult = results[1]

    // Check if any validation request failed completely
    const hasRequestError = results.some((r) => r.status === 'rejected')

    if (hasRequestError) {
      // If any request failed, show a generic error and stop
      toast.error('Failed to validate configuration. Please try again.')
      setHasRunValidation(false)
      return false
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

    // Scroll to validation section if there are any failures
    if (hasAnyFailures) {
      setTimeout(() => {
        validationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }

    return !hasCriticalFailures
  }

  // [Joshen] I reckon this function can be refactored to be a bit more modular, it's currently pretty
  // complicated with 4 different types of flows -> edit bigquery/analytics, and create bigquery/analytics
  // At first glance we could try grouping as edit / create bigquery, edit / create analytics
  // since the destination config seems rather similar between edit and create for the same type
  const submitPipeline = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return console.error('Source id is required')
    if (isSelectedPublicationMissing) {
      return toast.error('Please select another publication before continuing')
    }

    try {
      if (editMode && existingDestination) {
        if (!existingDestination.pipelineId) return console.error('Pipeline id is required')

        let destinationConfig: DestinationConfig | undefined = undefined

        if (selectedType === 'BigQuery') {
          const bigQueryConfig: BigQueryDestinationConfig = {
            projectId: data.projectId ?? '',
            datasetId: data.datasetId ?? '',
            serviceAccountKey: data.serviceAccountKey ?? '',
          }
          if (!!data.maxStalenessMins) {
            bigQueryConfig.maxStalenessMins = data.maxStalenessMins
          }
          destinationConfig = { bigQuery: bigQueryConfig }
        } else if (selectedType === 'Analytics Bucket') {
          let s3Keys = { accessKey: data.s3AccessKeyId, secretKey: data.s3SecretAccessKey }

          if (data.s3AccessKeyId === CREATE_NEW_KEY) {
            const newKeys = await createS3AccessKey({
              projectRef,
              description: `Autogenerated key for replication to ${snakeCase(warehouseName)}`,
            })
            s3Keys = { accessKey: newKeys.access_key, secretKey: newKeys.secret_key }
          }

          // Resolve namespace (create if needed)
          const finalNamespace = await resolveNamespace(data)

          const icebergConfig: IcebergDestinationConfig = {
            projectRef: projectRef,
            warehouseName: data.warehouseName ?? '',
            namespace: finalNamespace,
            catalogToken: data.catalogToken ?? '',
            s3AccessKeyId: s3Keys.accessKey ?? '',
            s3SecretAccessKey: s3Keys.secretKey ?? '',
            s3Region: data.s3Region ?? '',
          }
          destinationConfig = { iceberg: icebergConfig }
        }

        const batchConfig: BatchConfig | undefined =
          data.maxFillMs !== undefined || data.maxSize !== undefined
            ? {
                ...(data.maxFillMs !== undefined ? { maxFillMs: data.maxFillMs } : {}),
                ...(data.maxSize !== undefined ? { maxSize: data.maxSize } : {}),
              }
            : undefined
        const hasBatchFields = batchConfig !== undefined

        if (!destinationConfig) throw new Error('Destination configuration is missing')

        await updateDestinationPipeline({
          destinationId: existingDestination.destinationId,
          pipelineId: existingDestination.pipelineId,
          projectRef,
          destinationName: data.name,
          destinationConfig,
          pipelineConfig: {
            publicationName: data.publicationName,
            maxTableSyncWorkers: data.maxTableSyncWorkers,
            ...(hasBatchFields ? { batch: batchConfig } : {}),
          },
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
        let destinationConfig: DestinationConfig | undefined = undefined

        if (selectedType === 'BigQuery') {
          const bigQueryConfig: BigQueryDestinationConfig = {
            projectId: data.projectId ?? '',
            datasetId: data.datasetId ?? '',
            serviceAccountKey: data.serviceAccountKey ?? '',
          }
          if (!!data.maxStalenessMins) {
            bigQueryConfig.maxStalenessMins = data.maxStalenessMins
          }
          destinationConfig = { bigQuery: bigQueryConfig }
        } else if (selectedType === 'Analytics Bucket') {
          let s3Keys = { accessKey: data.s3AccessKeyId, secretKey: data.s3SecretAccessKey }

          if (data.s3AccessKeyId === CREATE_NEW_KEY) {
            const newKeys = await createS3AccessKey({
              projectRef,
              description: `Autogenerated key for replication to ${snakeCase(warehouseName)}`,
            })
            s3Keys = { accessKey: newKeys.access_key, secretKey: newKeys.secret_key }
          }

          // Resolve namespace (create if needed)
          const finalNamespace = await resolveNamespace(data)

          const icebergConfig: IcebergDestinationConfig = {
            projectRef: projectRef,
            warehouseName: data.warehouseName ?? '',
            namespace: finalNamespace,
            catalogToken: data.catalogToken ?? '',
            s3AccessKeyId: s3Keys.accessKey ?? '',
            s3SecretAccessKey: s3Keys.secretKey ?? '',
            s3Region: data.s3Region ?? '',
          }
          destinationConfig = { iceberg: icebergConfig }
        }
        const batchConfig: BatchConfig | undefined =
          data.maxFillMs !== undefined || data.maxSize !== undefined
            ? {
                ...(data.maxFillMs !== undefined ? { maxFillMs: data.maxFillMs } : {}),
                ...(data.maxSize !== undefined ? { maxSize: data.maxSize } : {}),
              }
            : undefined
        const hasBatchFields = batchConfig !== undefined

        if (!destinationConfig) throw new Error('Destination configuration is missing')

        const { pipeline_id: pipelineId } = await createDestinationPipeline({
          projectRef,
          destinationName: data.name,
          destinationConfig,
          sourceId,
          pipelineConfig: {
            publicationName: data.publicationName,
            maxTableSyncWorkers: data.maxTableSyncWorkers,
            ...(hasBatchFields ? { batch: batchConfig } : {}),
          },
        })
        // Set request status only right before starting, then fire and close
        setRequestStatus(pipelineId, PipelineStatusRequestStatus.StartRequested, undefined)
        toast.success('Destination created. Starting the pipeline...')
        startPipeline({ projectRef, pipelineId })
        onClose()
      }
    } catch (error) {
      const action = editMode ? 'apply and run' : 'create and start'
      toast.error(`Failed to ${action} destination`)
    }
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!editMode) {
      // For new pipelines, validate configuration first if not already validated
      // OR if user has critical failures and clicks "Validate again"
      if (!hasRunValidation || isValidating || hasValidationFailures) {
        const isValid = await validateConfiguration(data)
        if (!isValid) {
          // Validation failed with critical errors, show inline and stop
          return
        }
        // Validation passed or only has warnings, continue to disclaimer
      }

      // Validation passed or only warnings, proceed to disclaimer
      setPendingFormValues(data)
      setShowDisclaimerDialog(true)
      return
    }

    await submitPipeline(data)
  }

  const handleDisclaimerDialogChange = (open: boolean) => {
    setShowDisclaimerDialog(open)
    if (!open) {
      setPendingFormValues(null)
    }
  }

  const handleDisclaimerConfirm = async () => {
    if (!pendingFormValues) return

    const values = pendingFormValues
    setPendingFormValues(null)
    setShowDisclaimerDialog(false)
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
      <SheetSection className="flex-grow overflow-auto px-0 py-0">
        {hasNoAvailableDestinations && !editMode ? (
          <NoDestinationsAvailable />
        ) : (
          <Form_Shadcn_ {...form}>
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
          </Form_Shadcn_>
        )}
      </SheetSection>

      <SheetFooter className="!justify-between">
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
          <Button disabled={isSaving} type="default" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={isSubmitDisabled} loading={isSaving} form={formId} htmlType="submit">
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

      <ReplicationDisclaimerDialog
        open={showDisclaimerDialog}
        onOpenChange={handleDisclaimerDialogChange}
        isLoading={isSaving}
        onConfirm={handleDisclaimerConfirm}
      />
    </>
  )
}
