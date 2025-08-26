import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useCreateTenantSourceMutation } from 'data/replication/create-tenant-source-mutation'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
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
  WarningIcon,
} from 'ui'
import * as z from 'zod'
import PublicationsComboBox from './PublicationsComboBox'
import NewPublicationPanel from './NewPublicationPanel'
import { useState, useMemo, useEffect } from 'react'
import { useReplicationDestinationByIdQuery } from 'data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useCreateDestinationPipelineMutation } from 'data/replication/create-destination-pipeline-mutation'
import { useUpdateDestinationPipelineMutation } from 'data/replication/update-destination-pipeline-mutation'

interface DestinationPanelProps {
  visible: boolean
  sourceId: number | undefined
  onClose: () => void
  existingDestination?: {
    sourceId?: number
    destinationId: number
    pipelineId?: number
    enabled: boolean
  }
}

const DestinationPanel = ({
  visible,
  sourceId,
  onClose,
  existingDestination,
}: DestinationPanelProps) => {
  const { ref: projectRef } = useParams()
  const [publicationPanelVisible, setPublicationPanelVisible] = useState(false)
  const { mutateAsync: createTenantSource, isLoading: creatingTenantSource } =
    useCreateTenantSourceMutation()
  const { mutateAsync: createDestinationPipeline, isLoading: creatingDestinationPipeline } =
    useCreateDestinationPipelineMutation()
  const { mutateAsync: startPipeline, isLoading: startingPipeline } = useStartPipelineMutation()
  const { mutateAsync: updateDestinationPipeline, isLoading: updatingDestinationPipeline } =
    useUpdateDestinationPipelineMutation()
  const { data: publications, isLoading: loadingPublications } = useReplicationPublicationsQuery({
    projectRef,
    sourceId,
  })

  const { data: destinationData } = useReplicationDestinationByIdQuery({
    projectRef,
    destinationId: existingDestination?.destinationId,
  })

  const { data: pipelineData } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId: existingDestination?.pipelineId,
  })

  const isCreating = creatingTenantSource || creatingDestinationPipeline || startingPipeline
  const isUpdating = updatingDestinationPipeline || startingPipeline
  const isSubmitting = isCreating || isUpdating
  const editMode = !!existingDestination
  
  // Determine button text based on context
  const getButtonText = () => {
    if (!editMode) return 'Create'
    if (existingDestination?.enabled) return 'Apply and Restart'
    return 'Apply and Start'
  }

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
    maxSize: z.number().min(1, 'Max Size must be greater than 0').int().optional(),
    maxFillMs: z.number().min(1, 'Max Fill milliseconds should be greater than 0').int().optional(),
    maxStalenessMins: z.number().nonnegative().optional(),
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
      maxSize: pipelineData?.config?.batch?.max_size,
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
  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    try {
      if (editMode && existingDestination) {
        if (!sourceId) {
          console.error('Source id is required')
          return
        }
        if (!existingDestination.pipelineId) {
          console.error('Pipeline id is required')
          return
        }
        // Update existing destination
        const bigQueryConfig: any = {
          projectId: data.projectId,
          datasetId: data.datasetId,
          serviceAccountKey: data.serviceAccountKey,
        }
        if (data.maxStalenessMins != null) {
          bigQueryConfig.maxStalenessMins = data.maxStalenessMins
        }

        const batchConfig: any = {}
        if (data.maxSize != null) {
          batchConfig.maxSize = data.maxSize
        }
        if (data.maxFillMs != null) {
          batchConfig.maxFillMs = data.maxFillMs
        }
        const hasBothBatchFields = data.maxSize != null && data.maxFillMs != null

        await updateDestinationPipeline({
          destinationId: existingDestination.destinationId,
          pipelineId: existingDestination.pipelineId,
          projectRef,
          destinationName: data.name,
          destinationConfig: {
            bigQuery: bigQueryConfig,
          },
          pipelineConfig: {
            publicationName: data.publicationName,
            ...(hasBothBatchFields && { batch: batchConfig }),
          },
          sourceId,
        })
        
        // Always start/restart pipeline to apply changes
        await startPipeline({ projectRef, pipelineId: existingDestination.pipelineId })

        const actionText = existingDestination.enabled ? 'updated and restarted' : 'updated and started'
        toast.success(`Successfully ${actionText} destination`)
      } else {
        // Create new destination
        if (!sourceId) {
          console.error('Source id is required')
          return
        }
        const bigQueryConfig: any = {
          projectId: data.projectId,
          datasetId: data.datasetId,
          serviceAccountKey: data.serviceAccountKey,
        }
        if (data.maxStalenessMins != null) {
          bigQueryConfig.maxStalenessMins = data.maxStalenessMins
        }

        const batchConfig: any = {}
        if (data.maxSize != null) {
          batchConfig.maxSize = data.maxSize
        }
        if (data.maxFillMs != null) {
          batchConfig.maxFillMs = data.maxFillMs
        }
        const hasBothBatchFields = data.maxSize != null && data.maxFillMs != null

        const { pipeline_id: pipelineId } = await createDestinationPipeline({
          projectRef,
          destinationName: data.name,
          destinationConfig: {
            bigQuery: bigQueryConfig,
          },
          sourceId,
          pipelineConfig: {
            publicationName: data.publicationName,
            ...(hasBothBatchFields && { batch: batchConfig }),
          },
        })
        
        // Always start new pipelines
        await startPipeline({ projectRef, pipelineId })
        
        toast.success('Successfully created and started destination')
      }
      onClose()
    } catch (error) {
      const action = editMode 
        ? (existingDestination?.enabled ? 'update and restart' : 'update and start')
        : 'create'
      toast.error(`Failed to ${action} destination`)
    }
  }
  const onEnableReplication = async () => {
    if (!projectRef) return console.error('Project ref is required')
    await createTenantSource({ projectRef })
  }


  useEffect(() => {
    if (editMode && destinationData && pipelineData) {
      form.reset(defaultValues)
    }
  }, [destinationData, pipelineData, editMode, defaultValues, form])

  return (
    <>
      {sourceId ? (
        <>
          <Sheet open={visible} onOpenChange={onClose}>
            <SheetContent showClose={false} size="default">
              <div className="flex flex-col h-full" tabIndex={-1}>
                <SheetHeader>
                  <SheetTitle>{editMode ? 'Edit Destination' : 'New Destination'}</SheetTitle>
                  <SheetDescription>
                    {editMode ? null : 'Send data to a new destination'}
                  </SheetDescription>
                </SheetHeader>
                <SheetSection className="flex-grow overflow-auto">
                  <Form_Shadcn_ {...form}>
                    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
                      <FormField_Shadcn_
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItemLayout
                            className="mb-8"
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
                      <h3 className="mb-4">What data to send</h3>

                      <FormField_Shadcn_
                        control={form.control}
                        name="publicationName"
                        render={({ field }) => (
                          <FormItemLayout
                            className="mb-4"
                            label="Publication"
                            layout="vertical"
                            description="A publication is a collection of tables that you want to replicate "
                          >
                            <FormControl_Shadcn_>
                              <PublicationsComboBox
                                publications={publications?.map((pub) => pub.name) || []}
                                loading={loadingPublications}
                                field={field}
                                onNewPublicationClick={() => setPublicationPanelVisible(true)}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                      <h3 className="mb-4 mt-8">Where to send that data</h3>

                      <FormField_Shadcn_
                        name="type"
                        control={form.control}
                        render={({ field }) => (
                          <FormItemLayout
                            className="mb-4"
                            label="Type"
                            layout="vertical"
                            description="The type of destination to send the data to"
                          >
                            <FormControl_Shadcn_>
                              <Select_Shadcn_ value={field.value}>
                                <SelectTrigger_Shadcn_>{field.value}</SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  <SelectGroup_Shadcn_>
                                    <SelectItem_Shadcn_ value="BigQuery">
                                      BigQuery
                                    </SelectItem_Shadcn_>
                                  </SelectGroup_Shadcn_>
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      ></FormField_Shadcn_>

                      <FormField_Shadcn_
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItemLayout
                            className="mb-4"
                            label="Project Id"
                            layout="vertical"
                            description="Which BigQuery project to send data to"
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ {...field} placeholder="Project id" />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                      <FormField_Shadcn_
                        control={form.control}
                        name="datasetId"
                        render={({ field }) => (
                          <FormItemLayout
                            className="mb-4"
                            label="Project's Dataset Id"
                            layout="vertical"
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ {...field} placeholder="Dataset id" />
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

                      <Accordion_Shadcn_ type="single" collapsible>
                        <AccordionItem_Shadcn_ value="item-1" className="border-none">
                          <AccordionTrigger_Shadcn_ className="font-normal gap-2 justify-start mb-0 mt-8">
                            Advanced Settings
                          </AccordionTrigger_Shadcn_>
                          <AccordionContent_Shadcn_ asChild className="!pb-0">
                            <FormField_Shadcn_
                              control={form.control}
                              name="maxSize"
                              render={({ field }) => (
                                <FormItemLayout
                                  className="mb-4"
                                  label="Max Size"
                                  layout="vertical"
                                  description="The maximum size of the data to send. Leave empty to use default value."
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
                              name="maxFillMs"
                              render={({ field }) => (
                                <FormItemLayout
                                  className="mb-4"
                                  label="Max Fill Milliseconds"
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
                                  label="Max Staleness Minutes"
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
                    </form>
                  </Form_Shadcn_>
                </SheetSection>
                <SheetFooter>
                  <Button disabled={isSubmitting} type="default" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    form={formId}
                    htmlType="submit"
                  >
                    {getButtonText()}
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
      ) : (
        <>
          <Sheet open={visible} onOpenChange={onClose}>
            <SheetContent showClose={false} size="default">
              <div className="flex flex-col h-full" tabIndex={-1}>
                <SheetHeader>
                  <SheetTitle>New Destination</SheetTitle>
                </SheetHeader>
                <SheetSection className="flex-grow overflow-auto">
                  <Alert_Shadcn_>
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      {/* Pricing to be decided yet */}
                      Enabling replication will cost additional $xx.xx
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      <span></span>
                      <div className="flex items-center gap-x-2 mt-3">
                        <Button type="default" onClick={onEnableReplication}>
                          Enable replication
                        </Button>
                      </div>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </SheetSection>
                <SheetFooter>
                  <Button disabled={isSubmitting} type="default" onClick={onClose}>
                    Cancel
                  </Button>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  )
}

export default DestinationPanel
