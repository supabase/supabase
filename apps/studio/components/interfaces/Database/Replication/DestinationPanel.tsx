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
  Switch,
  TextArea_Shadcn_,
  WarningIcon,
  Label_Shadcn_ as Label,
} from 'ui'
import * as z from 'zod'
import PublicationsComboBox from './PublicationsComboBox'
import NewPublicationPanel from './NewPublicationPanel'
import { useState, useMemo, useEffect } from 'react'
import { useReplicationSinkByIdQuery } from 'data/replication/sink-by-id-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useCreateSinkPipelineMutation } from 'data/replication/create-sink-pipeline-mutation'
import { useUpdateSinkPipelineMutation } from 'data/replication/update-sink-pipeline-mutation'

interface DestinationPanelProps {
  visible: boolean
  sourceId: number | undefined
  onClose: () => void
  existingDestination?: {
    sourceId?: number
    sinkId: number
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
  const { mutateAsync: createSinkPipeline, isLoading: creatingSinkPipeline } =
    useCreateSinkPipelineMutation()
  const { mutateAsync: startPipeline, isLoading: startingPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline, isLoading: stoppingPipeline } = useStopPipelineMutation()
  const { mutateAsync: updateSinkPipeline, isLoading: updatingSinkPipeline } =
    useUpdateSinkPipelineMutation()
  const { data: publications, isLoading: loadingPublications } = useReplicationPublicationsQuery({
    projectRef,
    sourceId,
  })

  const { data: sinkData } = useReplicationSinkByIdQuery({
    projectRef,
    sinkId: existingDestination?.sinkId,
  })

  const { data: pipelineData } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId: existingDestination?.pipelineId,
  })

  const isCreating = creatingTenantSource || creatingSinkPipeline || startingPipeline
  const isUpdating = updatingSinkPipeline || stoppingPipeline || startingPipeline
  const isSubmitting = isCreating || isUpdating
  const editMode = !!existingDestination

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
    maxSize: z.number().min(1, 'Max Size must be greater than 0').int(),
    maxFillSecs: z.number().min(1, 'Max Fill seconds should be greater than 0').int(),
    maxStalenessMins: z.number().nonnegative(),
    enabled: z.boolean(),
  })
  const defaultValues = useMemo(
    () => ({
      type: TypeEnum.enum.BigQuery,
      name: sinkData?.name ?? '',
      projectId: sinkData?.config?.big_query?.project_id ?? '',
      datasetId: sinkData?.config?.big_query?.dataset_id ?? '',
      serviceAccountKey: sinkData?.config?.big_query?.service_account_key ?? '',
      publicationName: pipelineData?.publication_name ?? '',
      maxSize: pipelineData?.config?.config?.max_size ?? 1000,
      maxFillSecs: pipelineData?.config?.config?.max_fill_secs ?? 10,
      maxStalenessMins: sinkData?.config?.big_query?.max_staleness_mins ?? 5,
      enabled: existingDestination?.enabled ?? true,
    }),
    [sinkData, pipelineData, existingDestination]
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
        await updateSinkPipeline({
          sinkId: existingDestination.sinkId,
          pipelineId: existingDestination.pipelineId,
          projectRef,
          sinkName: data.name,
          sinkConfig: {
            bigQuery: {
              projectId: data.projectId,
              datasetId: data.datasetId,
              serviceAccountKey: data.serviceAccountKey,
              maxStalenessMins: data.maxStalenessMins,
            },
          },
          pipelinConfig: {
            config: { maxSize: data.maxSize, maxFillSecs: data.maxFillSecs },
          },
          publicationName: data.publicationName,
          sourceId,
        })
        if (data.enabled) {
          await startPipeline({ projectRef, pipelineId: existingDestination.pipelineId })
        } else {
          await stopPipeline({ projectRef, pipelineId: existingDestination.pipelineId })
        }

        toast.success('Successfully updated destination')
      } else {
        // Create new destination
        if (!sourceId) {
          console.error('Source id is required')
          return
        }
        const { pipeline_id: pipelineId } = await createSinkPipeline({
          projectRef,
          sinkName: data.name,
          sinkConfig: {
            bigQuery: {
              projectId: data.projectId,
              datasetId: data.datasetId,
              serviceAccountKey: data.serviceAccountKey,
              maxStalenessMins: data.maxStalenessMins,
            },
          },
          sourceId,
          publicationName: data.publicationName,
          pipelinConfig: {
            config: { maxSize: data.maxSize, maxFillSecs: data.maxFillSecs },
          },
        })
        if (data.enabled) {
          await startPipeline({ projectRef, pipelineId })
        }
        toast.success('Successfully created destination')
      }
      onClose()
    } catch (error) {
      toast.error(`Failed to ${editMode ? 'update' : 'create'} destination`)
    }
  }
  const onEnableReplication = async () => {
    if (!projectRef) return console.error('Project ref is required')
    await createTenantSource({ projectRef })
  }

  const { enabled } = form.watch()

  useEffect(() => {
    if (editMode && sinkData && pipelineData) {
      form.reset(defaultValues)
    }
  }, [sinkData, pipelineData, editMode, defaultValues, form])

  return (
    <>
      {sourceId ? (
        <>
          <Sheet open={visible} onOpenChange={onClose}>
            <SheetContent showClose={false} size="default">
              <div className="flex flex-col h-full" tabIndex={-1}>
                <SheetHeader className="flex justify-between items-center">
                  <div>
                    <SheetTitle>{editMode ? 'Edit Destination' : 'New Destination'}</SheetTitle>
                    <SheetDescription>
                      {editMode ? null : 'Send data to a new destination'}
                    </SheetDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        form.setValue('enabled', checked)
                      }}
                    />
                    <Label className="text-sm mx-2">Enable</Label>
                  </div>
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
                                  description="The maximum size of the data to send"
                                >
                                  <FormControl_Shadcn_>
                                    <Input_Shadcn_
                                      {...field}
                                      type="number"
                                      {...form.register('maxSize', {
                                        valueAsNumber: true, // Ensure the value is handled as a number
                                      })}
                                      placeholder="Max size"
                                    />
                                  </FormControl_Shadcn_>
                                </FormItemLayout>
                              )}
                            />
                            <FormField_Shadcn_
                              control={form.control}
                              name="maxFillSecs"
                              render={({ field }) => (
                                <FormItemLayout
                                  className="mb-4"
                                  label="Max Fill Seconds"
                                  layout="vertical"
                                  description="The maximum amount of time to fill the data"
                                >
                                  <FormControl_Shadcn_>
                                    <Input_Shadcn_
                                      {...field}
                                      type="number"
                                      {...form.register('maxFillSecs', {
                                        valueAsNumber: true, // Ensure the value is handled as a number
                                      })}
                                      placeholder="Max fill seconds"
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
                                  label="Max Staleness"
                                  layout="vertical"
                                  description="Maximum staleness time allowed"
                                >
                                  <FormControl_Shadcn_>
                                    <Input_Shadcn_
                                      {...field}
                                      type="number"
                                      {...form.register('maxStalenessMins', {
                                        valueAsNumber: true, // Ensure the value is handled as a number
                                      })}
                                      placeholder="Max staleness in minutes"
                                    />
                                  </FormControl_Shadcn_>
                                </FormItemLayout>
                              )}
                            />
                          </AccordionContent_Shadcn_>
                        </AccordionItem_Shadcn_>
                      </Accordion_Shadcn_>
                      <div className="hidden">
                        <FormField_Shadcn_
                          control={form.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItemLayout className="mb-4" layout="vertical" label="Enabled">
                              <FormControl_Shadcn_>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </div>
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
                    {editMode ? 'Update' : 'Create'}
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
