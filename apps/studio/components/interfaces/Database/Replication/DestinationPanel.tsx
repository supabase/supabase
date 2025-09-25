import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useCreateDestinationPipelineMutation } from 'data/replication/create-destination-pipeline-mutation'
import { useReplicationDestinationByIdQuery } from 'data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useUpdateDestinationPipelineMutation } from 'data/replication/update-destination-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
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
  TextArea_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import NewPublicationPanel from './NewPublicationPanel'
import PublicationsComboBox from './PublicationsComboBox'

const formId = 'destination-editor'
const types = ['BigQuery'] as const
const TypeEnum = z.enum(types)

const FormSchema = z.object({
  type: TypeEnum,
  name: z.string().min(1, 'Name is required'),
  projectId: z.string().min(1, 'Project id is required'),
  datasetId: z.string().min(1, 'Dataset id is required'),
  serviceAccountKey: z.string().min(1, 'Service account key is required'),
  publicationName: z.string().min(1, 'Publication is required'),
  maxFillMs: z.number().min(1, 'Max Fill milliseconds should be greater than 0').int().optional(),
  maxStalenessMins: z.number().nonnegative().optional(),
})

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
  const { setRequestStatus } = usePipelineRequestStatus()

  const editMode = !!existingDestination
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)

  const { mutateAsync: createDestinationPipeline, isLoading: creatingDestinationPipeline } =
    useCreateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
    })

  const { mutateAsync: updateDestinationPipeline, isLoading: updatingDestinationPipeline } =
    useUpdateDestinationPipelineMutation({
      onSuccess: () => form.reset(defaultValues),
    })

  const { mutateAsync: startPipeline, isLoading: startingPipeline } = useStartPipelineMutation()

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

  const defaultValues = useMemo(
    () => ({
      type: TypeEnum.enum.BigQuery,
      name: destinationData?.name ?? '',
      projectId: destinationData?.config?.big_query?.project_id ?? '',
      datasetId: destinationData?.config?.big_query?.dataset_id ?? '',
      // For now, the password will always be set as empty for security reasons.
      serviceAccountKey: destinationData?.config?.big_query?.service_account_key ?? '',
      publicationName: pipelineData?.config.publication_name ?? '',
      maxFillMs: pipelineData?.config?.batch?.max_fill_ms,
      maxStalenessMins: destinationData?.config?.big_query?.max_staleness_mins,
    }),
    [destinationData, pipelineData]
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })
  const publicationName = form.watch('publicationName')
  const isSaving = creatingDestinationPipeline || updatingDestinationPipeline || startingPipeline

  const publicationNames = useMemo(() => publications?.map((pub) => pub.name) ?? [], [publications])
  const isSelectedPublicationMissing =
    isSuccessPublications && !!publicationName && !publicationNames.includes(publicationName)

  const isSubmitDisabled = isSaving || isSelectedPublicationMissing

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!sourceId) return console.error('Source id is required')
    if (isSelectedPublicationMissing) {
      return toast.error('Please select another publication before continuing')
    }

    try {
      if (editMode && existingDestination) {
        if (!existingDestination.pipelineId) return console.error('Pipeline id is required')

        const bigQueryConfig: any = {
          projectId: data.projectId,
          datasetId: data.datasetId,
          serviceAccountKey: data.serviceAccountKey,
        }
        if (!!data.maxStalenessMins) {
          bigQueryConfig.maxStalenessMins = data.maxStalenessMins
        }

        const batchConfig: any = {}
        if (!!data.maxFillMs) batchConfig.maxFillMs = data.maxFillMs
        const hasBatchFields = Object.keys(batchConfig).length > 0

        await updateDestinationPipeline({
          destinationId: existingDestination.destinationId,
          pipelineId: existingDestination.pipelineId,
          projectRef,
          destinationName: data.name,
          destinationConfig: { bigQuery: bigQueryConfig },
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
        const bigQueryConfig: any = {
          projectId: data.projectId,
          datasetId: data.datasetId,
          serviceAccountKey: data.serviceAccountKey,
        }
        if (!!data.maxStalenessMins) {
          bigQueryConfig.maxStalenessMins = data.maxStalenessMins
        }

        const batchConfig: any = {}
        if (!!data.maxFillMs) batchConfig.maxFillMs = data.maxFillMs
        const hasBatchFields = Object.keys(batchConfig).length > 0

        const { pipeline_id: pipelineId } = await createDestinationPipeline({
          projectRef,
          destinationName: data.name,
          destinationConfig: { bigQuery: bigQueryConfig },
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

  useEffect(() => {
    if (editMode && destinationData && pipelineData) {
      form.reset(defaultValues)
    }
  }, [destinationData, pipelineData, editMode, defaultValues, form])

  // Ensure the form always reflects the freshest data whenever the panel opens
  useEffect(() => {
    if (visible) {
      form.reset(defaultValues)
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
                              loading={isLoadingPublications}
                              field={field}
                              onNewPublicationClick={() => setPublicationPanelVisible(true)}
                            />
                          </FormControl_Shadcn_>
                          {isSelectedPublicationMissing && (
                            <Admonition type="warning" className="mt-2 mb-0">
                              <p className="!leading-normal">
                                The publication{' '}
                                <strong className="text-foreground">{publicationName}</strong> was
                                not found, it may have been renamed or deleted, please select
                                another one.
                              </p>
                            </Admonition>
                          )}
                        </FormItemLayout>
                      )}
                    />
                  </div>

                  <DialogSectionSeparator />

                  <div className="p-5 flex flex-col gap-y-4">
                    <p className="text-sm text-foreground-light">Where to send that data</p>
                    <FormField_Shadcn_
                      name="type"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout
                          label="Type"
                          layout="vertical"
                          description="The type of destination to send the data to"
                        >
                          <FormControl_Shadcn_>
                            <Select_Shadcn_ value={field.value}>
                              <SelectTrigger_Shadcn_>{field.value}</SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                <SelectGroup_Shadcn_>
                                  <SelectItem_Shadcn_ value="BigQuery">BigQuery</SelectItem_Shadcn_>
                                </SelectGroup_Shadcn_>
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    <FormField_Shadcn_
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItemLayout
                          label="Project ID"
                          layout="vertical"
                          description="Which BigQuery project to send data to"
                        >
                          <FormControl_Shadcn_>
                            <Input_Shadcn_ {...field} placeholder="Project ID" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    <FormField_Shadcn_
                      control={form.control}
                      name="datasetId"
                      render={({ field }) => (
                        <FormItemLayout label="Project's Dataset ID" layout="vertical">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_ {...field} placeholder="Dataset ID" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />

                    <FormField_Shadcn_
                      control={form.control}
                      name="serviceAccountKey"
                      render={({ field }) => (
                        <FormItemLayout
                          label="Service Account Key"
                          layout="vertical"
                          description="The service account key for BigQuery"
                        >
                          <FormControl_Shadcn_>
                            <TextArea_Shadcn_
                              {...field}
                              rows={4}
                              maxLength={5000}
                              placeholder="Service account key"
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </div>

                  <DialogSectionSeparator />

                  <div className="px-5">
                    <Accordion_Shadcn_ type="single" collapsible>
                      <AccordionItem_Shadcn_ value="item-1" className="border-none">
                        <AccordionTrigger_Shadcn_ className="font-normal gap-2 justify-between text-sm">
                          Advanced Settings
                        </AccordionTrigger_Shadcn_>
                        <AccordionContent_Shadcn_ asChild className="!pb-0">
                          <FormField_Shadcn_
                            control={form.control}
                            name="maxFillMs"
                            render={({ field }) => (
                              <FormItemLayout
                                className="mb-4"
                                label="Max fill milliseconds"
                                layout="vertical"
                                description="The maximum amount of time to fill the data in milliseconds. Leave empty to use default value."
                              >
                                <FormControl_Shadcn_>
                                  <Input_Shadcn_
                                    {...field}
                                    type="number"
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      field.onChange(val === '' ? undefined : Number(val))
                                    }}
                                    placeholder="Leave empty for default"
                                  />
                                </FormControl_Shadcn_>
                              </FormItemLayout>
                            )}
                          />
                          <FormField_Shadcn_
                            control={form.control}
                            name="maxStalenessMins"
                            render={({ field }) => (
                              <FormItemLayout
                                className="mb-4"
                                label="Max staleness minutes"
                                layout="vertical"
                                description="Maximum staleness time allowed in minutes. Leave empty to use default value."
                              >
                                <FormControl_Shadcn_>
                                  <Input_Shadcn_
                                    {...field}
                                    type="number"
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      field.onChange(val === '' ? undefined : Number(val))
                                    }}
                                    placeholder="Leave empty for default"
                                  />
                                </FormControl_Shadcn_>
                              </FormItemLayout>
                            )}
                          />
                        </AccordionContent_Shadcn_>
                      </AccordionItem_Shadcn_>
                    </Accordion_Shadcn_>
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

      <NewPublicationPanel
        visible={publicationPanelVisible}
        sourceId={sourceId}
        onClose={() => setPublicationPanelVisible(false)}
      />
    </>
  )
}
