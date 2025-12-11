import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useFlag, useParams } from 'common'
import { useApiKeysVisibility } from 'components/interfaces/APIKeys/hooks/useApiKeysVisibility'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckPrimaryKeysExists } from 'data/database/primary-keys-exists-query'
import { useCreateDestinationPipelineMutation } from 'data/replication/create-destination-pipeline-mutation'
import { useReplicationDestinationByIdQuery } from 'data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useRestartPipelineHelper } from 'data/replication/restart-pipeline-helper'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useUpdateDestinationPipelineMutation } from 'data/replication/update-destination-pipeline-mutation'
import { useIcebergNamespaceCreateMutation } from 'data/storage/iceberg-namespace-create-mutation'
import { useS3AccessKeyCreateMutation } from 'data/storage/s3-access-key-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import {
  Button,
  DialogSectionSeparator,
  Form_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { NewPublicationPanel } from '../NewPublicationPanel'
import { ReplicationDisclaimerDialog } from '../ReplicationDisclaimerDialog'
import { AdvancedSettings } from './AdvancedSettings'
import { DestinationNameInput } from './DestinationNameInput'
import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from './DestinationPanel.constants'
import { DestinationPanelFormSchema as FormSchema, TypeEnum } from './DestinationPanel.schema'
import { AnalyticsBucketFields, BigQueryFields } from './DestinationPanelFields'
import { DestinationTypeSelection } from './DestinationTypeSelection'
import { NoDestinationsAvailable } from './NoDestinationsAvailable'
import { PublicationSelection } from './PublicationSelection'

const formId = 'destination-editor'

interface DestinationPanelProps {
  visible: boolean
  sourceId: number | undefined
  onClose: () => void
  existingDestination?: {
    sourceId?: number
    destinationId: number
    pipelineId?: number
    enabled: boolean
    statusName?: string
  }
}

export const DestinationPanel = ({
  visible,
  sourceId,
  onClose,
  existingDestination,
}: DestinationPanelProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { setRequestStatus } = usePipelineRequestStatus()

  // Feature flags for ETL destinations
  const etlEnableBigQuery = useFlag('etlEnableBigQuery')
  const etlEnableIceberg = useFlag('etlEnableIceberg')

  // Compute available destinations based on feature flags
  const availableDestinations = useMemo(() => {
    const destinations = []
    if (etlEnableBigQuery) destinations.push({ value: 'BigQuery', label: 'BigQuery' })
    if (etlEnableIceberg)
      destinations.push({ value: 'Analytics Bucket', label: 'Analytics Bucket' })
    return destinations
  }, [etlEnableBigQuery, etlEnableIceberg])

  const hasNoAvailableDestinations = availableDestinations.length === 0

  const editMode = !!existingDestination
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof FormSchema> | null>(
    null
  )
  const [isFormInteracting, setIsFormInteracting] = useState(false)

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

  const { canReadAPIKeys } = useApiKeysVisibility()
  const { data: apiKeys } = useAPIKeysQuery(
    { projectRef, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { serviceKey } = getKeys(apiKeys)
  const catalogToken = serviceKey?.api_key ?? ''

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const defaultValues = useMemo(() => {
    const config = destinationData?.config
    const isBigQueryConfig = config && 'big_query' in config
    const isIcebergConfig = config && 'iceberg' in config

    const defaultType = editMode
      ? isBigQueryConfig
        ? TypeEnum.enum.BigQuery
        : TypeEnum.enum['Analytics Bucket']
      : (availableDestinations[0]?.value as z.infer<typeof TypeEnum>) || TypeEnum.enum.BigQuery

    return {
      // Common fields
      type: defaultType,
      name: destinationData?.name ?? '',
      publicationName: pipelineData?.config.publication_name ?? '',
      maxFillMs: pipelineData?.config?.batch?.max_fill_ms,
      // BigQuery fields
      projectId: isBigQueryConfig ? config.big_query.project_id : '',
      datasetId: isBigQueryConfig ? config.big_query.dataset_id : '',
      serviceAccountKey: isBigQueryConfig ? config.big_query.service_account_key : '',
      maxStalenessMins: isBigQueryConfig ? config.big_query.max_staleness_mins : undefined,
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
  }, [
    destinationData,
    pipelineData,
    catalogToken,
    projectSettings,
    editMode,
    availableDestinations,
  ])

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })
  const { publicationName, type: selectedType, warehouseName } = form.watch()
  const isSaving =
    creatingDestinationPipeline ||
    updatingDestinationPipeline ||
    startingPipeline ||
    isCreatingS3AccessKey ||
    isCreatingNamespace

  const publicationNames = useMemo(() => publications?.map((pub) => pub.name) ?? [], [publications])
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)

  const selectedPublication = publications.find((pub) => pub.name === publicationName)
  const { data: checkPrimaryKeysExistsData, isPending: isLoadingCheck } = useCheckPrimaryKeysExists(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tables: selectedPublication?.tables ?? [],
    },
    { enabled: visible && !!selectedPublication }
  )
  const hasTablesWithNoPrimaryKeys = (checkPrimaryKeysExistsData?.offendingTables ?? []).length > 0

  const isSubmitDisabled =
    isSaving ||
    isSelectedPublicationMissing ||
    (!!selectedPublication && isLoadingCheck) ||
    hasTablesWithNoPrimaryKeys ||
    (!editMode && hasNoAvailableDestinations)

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

        let destinationConfig: any = {}

        if (data.type === 'BigQuery') {
          const bigQueryConfig: any = {
            projectId: data.projectId,
            datasetId: data.datasetId,
            serviceAccountKey: data.serviceAccountKey,
          }
          if (!!data.maxStalenessMins) {
            bigQueryConfig.maxStalenessMins = data.maxStalenessMins
          }
          destinationConfig = { bigQuery: bigQueryConfig }
        } else if (data.type === 'Analytics Bucket') {
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

          const icebergConfig: any = {
            projectRef: projectRef,
            warehouseName: data.warehouseName,
            namespace: finalNamespace,
            catalogToken: data.catalogToken,
            s3AccessKeyId: s3Keys.accessKey,
            s3SecretAccessKey: s3Keys.secretKey,
            s3Region: data.s3Region,
          }
          destinationConfig = { iceberg: icebergConfig }
        }

        const batchConfig: any = {}
        if (!!data.maxFillMs) batchConfig.maxFillMs = data.maxFillMs
        const hasBatchFields = Object.keys(batchConfig).length > 0

        await updateDestinationPipeline({
          destinationId: existingDestination.destinationId,
          pipelineId: existingDestination.pipelineId,
          projectRef,
          destinationName: data.name,
          destinationConfig,
          pipelineConfig: {
            publicationName: data.publicationName,
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
        let destinationConfig: any = {}

        if (data.type === 'BigQuery') {
          const bigQueryConfig: any = {
            projectId: data.projectId,
            datasetId: data.datasetId,
            serviceAccountKey: data.serviceAccountKey,
          }
          if (!!data.maxStalenessMins) {
            bigQueryConfig.maxStalenessMins = data.maxStalenessMins
          }
          destinationConfig = { bigQuery: bigQueryConfig }
        } else if (data.type === 'Analytics Bucket') {
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

          const icebergConfig: any = {
            projectRef: projectRef,
            warehouseName: data.warehouseName,
            namespace: finalNamespace,
            catalogToken: data.catalogToken,
            s3AccessKeyId: s3Keys.accessKey,
            s3SecretAccessKey: s3Keys.secretKey,
            s3Region: data.s3Region,
          }
          destinationConfig = { iceberg: icebergConfig }
        }
        const batchConfig: any = {}
        if (!!data.maxFillMs) batchConfig.maxFillMs = data.maxFillMs
        const hasBatchFields = Object.keys(batchConfig).length > 0

        const { pipeline_id: pipelineId } = await createDestinationPipeline({
          projectRef,
          destinationName: data.name,
          destinationConfig,
          sourceId,
          pipelineConfig: {
            publicationName: data.publicationName,
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
    }
  }, [visible, defaultValues, form])

  useEffect(() => {
    if (visible && projectRef && sourceId) {
      refetchPublications()
    }
  }, [visible, projectRef, sourceId, refetchPublications])

  return (
    <>
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent
          showClose={false}
          size="default"
          className={publicationPanelVisible ? 'right-32' : 'right-0'}
        >
          <div className="flex flex-col h-full" tabIndex={-1}>
            <SheetHeader>
              <SheetTitle>{editMode ? 'Edit destination' : 'Create a new destination'}</SheetTitle>
              <SheetDescription>
                {editMode
                  ? 'Update the configuration for this destination'
                  : 'A destination is an external platform that automatically receives your database changes in real time.'}
              </SheetDescription>
            </SheetHeader>

            <SheetSection className="flex-grow overflow-auto px-0 py-0">
              {hasNoAvailableDestinations && !editMode ? (
                <NoDestinationsAvailable />
              ) : (
                <Form_Shadcn_ {...form}>
                  <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="p-5">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Destination details
                      </p>
                      <p className="text-sm text-foreground-light mb-4">
                        Name your destination and choose which data to replicate
                      </p>

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
                    <DestinationTypeSelection form={form} editMode={editMode} />
                    {selectedType === 'BigQuery' && etlEnableBigQuery ? (
                      <>
                        <DialogSectionSeparator />
                        <BigQueryFields form={form} />
                      </>
                    ) : selectedType === 'Analytics Bucket' && etlEnableIceberg ? (
                      <>
                        <DialogSectionSeparator />
                        <AnalyticsBucketFields
                          form={form}
                          setIsFormInteracting={setIsFormInteracting}
                        />
                      </>
                    ) : null}
                    <DialogSectionSeparator />
                    <AdvancedSettings form={form} />
                  </form>
                </Form_Shadcn_>
              )}
            </SheetSection>

            <SheetFooter>
              <Button disabled={isSaving} type="default" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={isSubmitDisabled}
                loading={isSaving}
                form={formId}
                htmlType="submit"
              >
                {editMode
                  ? existingDestination?.enabled
                    ? 'Apply and restart'
                    : 'Apply and start'
                  : 'Create and start'}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <NewPublicationPanel
        sourceId={sourceId}
        visible={publicationPanelVisible}
        onClose={() => setPublicationPanelVisible(false)}
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
