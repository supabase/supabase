import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { getCatalogURI } from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { InlineLink } from 'components/ui/InlineLink'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckPrimaryKeysExists } from 'data/database/primary-keys-exists-query'
import { useCreateDestinationPipelineMutation } from 'data/replication/create-destination-pipeline-mutation'
import { useReplicationDestinationByIdQuery } from 'data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
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
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { NewPublicationPanel } from '../NewPublicationPanel'
import { PublicationsComboBox } from '../PublicationsComboBox'
import { ReplicationDisclaimerDialog } from '../ReplicationDisclaimerDialog'
import { AdvancedSettings } from './AdvancedSettings'
import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from './DestinationPanel.constants'
import { DestinationPanelFormSchema as FormSchema, TypeEnum } from './DestinationPanel.schema'
import { AnalyticsBucketFields, BigQueryFields } from './DestinationPanelFields'

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

  const editMode = !!existingDestination
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof FormSchema> | null>(
    null
  )
  const [isFormInteracting, setIsFormInteracting] = useState(false)

  const { mutateAsync: createDestinationPipeline, isLoading: creatingDestinationPipeline } =
    useCreateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
    })

  const { mutateAsync: updateDestinationPipeline, isLoading: updatingDestinationPipeline } =
    useUpdateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
    })

  const { mutateAsync: startPipeline, isLoading: startingPipeline } = useStartPipelineMutation()

  const { mutateAsync: createS3AccessKey, isLoading: isCreatingS3AccessKey } =
    useS3AccessKeyCreateMutation()

  const { mutateAsync: createNamespace, isLoading: isCreatingNamespace } =
    useIcebergNamespaceCreateMutation()

  const {
    data: publications = [],
    isLoading: isLoadingPublications,
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

  const { data: apiKeys } = useAPIKeysQuery({ projectRef, reveal: true })
  const { serviceKey } = getKeys(apiKeys)
  const catalogToken = serviceKey?.api_key ?? ''

  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef })

  const defaultValues = useMemo(() => {
    // Type guards to safely access union properties
    const config = destinationData?.config
    const isBigQueryConfig = config && 'big_query' in config
    const isIcebergConfig = config && 'iceberg' in config

    return {
      // Common fields
      type: (isBigQueryConfig
        ? TypeEnum.enum.BigQuery
        : isIcebergConfig
          ? TypeEnum.enum['Analytics Bucket']
          : TypeEnum.enum.BigQuery) as z.infer<typeof TypeEnum>,
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
  }, [destinationData, pipelineData, catalogToken, projectSettings])

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
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
  const { data: checkPrimaryKeysExistsData, isLoading: isLoadingCheck } = useCheckPrimaryKeysExists(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tables: selectedPublication?.tables ?? [],
    },
    { enabled: visible && !!selectedPublication }
  )
  const hasTablesWithNoPrimaryKeys = (checkPrimaryKeysExistsData?.offendingTables ?? []).length > 0

  const isSubmitDisabled =
    isSaving || isSelectedPublicationMissing || isLoadingCheck || hasTablesWithNoPrimaryKeys

  // Helper function to handle namespace creation if needed
  const resolveNamespace = async (data: z.infer<typeof FormSchema>) => {
    if (data.namespace === CREATE_NEW_NAMESPACE) {
      if (!data.newNamespaceName) {
        throw new Error('New namespace name is required')
      }

      // Construct catalog URI for namespace creation
      const protocol = projectSettings?.app_config?.protocol ?? 'https'
      const endpoint =
        projectSettings?.app_config?.storage_endpoint || projectSettings?.app_config?.endpoint
      const catalogUri = getCatalogURI(project?.ref ?? '', protocol, endpoint)

      await createNamespace({
        catalogUri,
        warehouse: data.warehouseName!,
        token: catalogToken,
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
        } else {
          setRequestStatus(
            existingDestination.pipelineId,
            PipelineStatusRequestStatus.StartRequested,
            snapshot
          )
          toast.success('Settings applied. Starting the pipeline...')
        }
        startPipeline({ projectRef, pipelineId: existingDestination.pipelineId })
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
        <SheetContent showClose={false} size="default">
          <div className="flex flex-col h-full" tabIndex={-1}>
            <SheetHeader>
              <SheetTitle>{editMode ? 'Edit destination' : 'Create a new destination'}</SheetTitle>
              <SheetDescription>
                {editMode ? null : 'Send data to a new destination'}
              </SheetDescription>
            </SheetHeader>

            <SheetSection className="flex-grow overflow-auto px-0 py-0">
              <Form_Shadcn_ {...form}>
                <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField_Shadcn_
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItemLayout
                        className="p-5"
                        label="Name"
                        layout="vertical"
                        description="A name you will use to identify this destination"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} placeholder="Name" />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  <DialogSectionSeparator />

                  <div className="p-5">
                    <p className="text-sm text-foreground-light mb-4">What data to send</p>
                    <FormField_Shadcn_
                      control={form.control}
                      name="publicationName"
                      render={({ field }) => (
                        <FormItemLayout
                          label="Publication"
                          layout="vertical"
                          description="A publication is a collection of tables that you want to replicate "
                        >
                          <FormControl_Shadcn_>
                            <PublicationsComboBox
                              publications={publicationNames}
                              isLoadingPublications={isLoadingPublications}
                              isLoadingCheck={!!selectedPublication && isLoadingCheck}
                              field={field}
                              onNewPublicationClick={() => setPublicationPanelVisible(true)}
                            />
                          </FormControl_Shadcn_>
                          {isSelectedPublicationMissing ? (
                            <Admonition type="warning" className="mt-2 mb-0">
                              <p className="!leading-normal">
                                The publication{' '}
                                <strong className="text-foreground">{publicationName}</strong> was
                                not found, it may have been renamed or deleted, please select
                                another one.
                              </p>
                            </Admonition>
                          ) : hasTablesWithNoPrimaryKeys ? (
                            <Admonition type="warning" className="mt-2 mb-0">
                              <p className="!leading-normal">
                                Replication requires every table in the publication to have a
                                primary key to work, which these tables are missing:
                              </p>
                              <ul className="list-disc pl-6 mb-2">
                                {(checkPrimaryKeysExistsData?.offendingTables ?? []).map((x) => {
                                  const value = `${x.schema}.${x.name}`
                                  return (
                                    <li key={value} className="!leading-normal">
                                      <InlineLink href={`/project/${projectRef}/editor/${x.id}`}>
                                        {value}
                                      </InlineLink>
                                    </li>
                                  )
                                })}
                              </ul>
                              <p className="!leading-normal">
                                Ensure that these tables have primary keys first.
                              </p>
                            </Admonition>
                          ) : null}
                        </FormItemLayout>
                      )}
                    />
                  </div>

                  <DialogSectionSeparator />

                  <div className="py-5 flex flex-col gap-y-4">
                    <p className="px-5 text-sm text-foreground-light">Where to send that data</p>
                    <FormField_Shadcn_
                      name="type"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout
                          label="Type"
                          layout="vertical"
                          className="px-5"
                          description="The type of destination to send the data to"
                        >
                          <FormControl_Shadcn_>
                            <Select_Shadcn_
                              value={field.value}
                              onValueChange={(value) => {
                                setIsFormInteracting(true)
                                field.onChange(value)
                              }}
                            >
                              <SelectTrigger_Shadcn_>{field.value}</SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                <SelectGroup_Shadcn_>
                                  <SelectItem_Shadcn_ value="BigQuery">BigQuery</SelectItem_Shadcn_>
                                  <SelectItem_Shadcn_ value="Analytics Bucket">
                                    Analytics Bucket
                                  </SelectItem_Shadcn_>
                                </SelectGroup_Shadcn_>
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    {selectedType === 'BigQuery' ? (
                      <BigQueryFields form={form} />
                    ) : selectedType === 'Analytics Bucket' ? (
                      <AnalyticsBucketFields
                        form={form}
                        setIsFormInteracting={setIsFormInteracting}
                      />
                    ) : null}
                  </div>

                  <DialogSectionSeparator />

                  <div className="px-5">
                    <AdvancedSettings form={form} />
                  </div>
                </form>
              </Form_Shadcn_>
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

      <ReplicationDisclaimerDialog
        open={showDisclaimerDialog}
        onOpenChange={handleDisclaimerDialogChange}
        isLoading={isSaving}
        onConfirm={handleDisclaimerConfirm}
      />

      <NewPublicationPanel
        visible={publicationPanelVisible}
        sourceId={sourceId}
        onClose={() => setPublicationPanelVisible(false)}
      />
    </>
  )
}
