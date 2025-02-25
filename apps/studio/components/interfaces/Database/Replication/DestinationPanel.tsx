import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useCreatePipelineMutation } from 'data/replication/create-pipeline-mutation'
import { useCreateSinkMutation } from 'data/replication/create-sink-mutation'
import { useCreateSourceMutation } from 'data/replication/create-source-mutation'
import { useReplicationPublicationsQuery } from 'data/replication/publications-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useUpdateSinkMutation } from 'data/replication/update-sink-mutation'
import { useUpdatePipelineMutation } from 'data/replication/update-pipeline-mutation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  TextArea_Shadcn_,
} from 'ui'
import * as z from 'zod'
import PublicationsComboBox from './PublicationsComboBox'
import NewPublicationPanel from './NewPublicationPanel'
import { useState } from 'react'
import { useReplicationSinkByIdQuery } from 'data/replication/sink-by-id-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'

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
  const { mutateAsync: createSource, isLoading: creatingSource } = useCreateSourceMutation()
  const { mutateAsync: createSink, isLoading: creatingSink } = useCreateSinkMutation()
  const { mutateAsync: createPipeline, isLoading: creatingPipeline } = useCreatePipelineMutation()
  const { mutateAsync: startPipeline, isLoading: startingPipeline } = useStartPipelineMutation()
  const { mutateAsync: updateSink } = useUpdateSinkMutation()
  const { mutateAsync: updatePipeline } = useUpdatePipelineMutation()
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

  const isCreating = creatingSource || creatingSink || creatingPipeline || startingPipeline
  const isEditing = !!existingDestination

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
    enabled: z.boolean(),
  })
  const defaultValues = {
    type: TypeEnum.enum.BigQuery,
    name: sinkData?.name ?? '',
    projectId: sinkData?.config.big_query.project_id ?? '',
    datasetId: sinkData?.config.big_query.dataset_id ?? '',
    serviceAccountKey: sinkData?.config.big_query.service_account_key ?? '',
    publicationName: pipelineData?.publication_name ?? '',
    maxSize: pipelineData?.config.config.max_size ?? 1000,
    maxFillSecs: pipelineData?.config.config.max_fill_secs ?? 10,
    enabled: existingDestination?.enabled ?? true,
  }
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })
  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    try {
      if (isEditing && existingDestination) {
        if (!sourceId) {
          console.error('Source id is required')
          return
        }
        // Update existing destination
        await updateSink({
          projectRef,
          sinkId: existingDestination.sinkId,
          sinkName: data.name,
          projectId: data.projectId,
          datasetId: data.datasetId,
          serviceAccountKey: data.serviceAccountKey,
        })

        if (existingDestination.pipelineId) {
          await updatePipeline({
            projectRef,
            pipelineId: existingDestination.pipelineId,
            sourceId,
            sinkId: existingDestination.sinkId,
            publicationName: data.publicationName,
            config: { config: { maxSize: data.maxSize, maxFillSecs: data.maxFillSecs } },
          })
        }

        toast.success('Successfully updated destination')
      } else {
        // Create new destination
        if (!sourceId) {
          const { id } = await createSource({ projectRef })
          sourceId = id
        }
        const { id: sinkId } = await createSink({
          projectRef,
          sink_name: data.name,
          project_id: data.projectId,
          dataset_id: data.datasetId,
          service_account_key: data.serviceAccountKey,
        })
        const { id: pipelineId } = await createPipeline({
          projectRef,
          sourceId,
          sinkId,
          publicationName: data.publicationName,
          config: { config: { maxSize: data.maxSize, maxFillSecs: data.maxFillSecs } },
        })
        if (data.enabled) {
          await startPipeline({ projectRef, pipelineId })
        }
        toast.success('Successfully created destination')
      }
      onClose()
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} destination`)
    }
    form.reset(defaultValues)
  }

  const { enabled } = form.watch()

  return (
    <>
      <Sheet open={visible} onOpenChange={onClose}>
        <SheetContent showClose={false} size="default">
          <div className="flex flex-col h-full" tabIndex={-1}>
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center justify-between">
                  <div>
                    <div>{isEditing ? 'Edit Destination' : 'New Destination'}</div>
                    <div className="text-xs">
                      {isEditing ? 'Modify existing destination' : 'Send data to a new destination'}
                    </div>
                  </div>
                  <div className="flex">
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        form.setValue('enabled', checked)
                      }}
                    />
                    <div className="text-sm mx-2">Enable</div>
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>
            <SheetSection className="flex-grow overflow-auto">
              <Form_Shadcn_ {...form}>
                <form
                  id={formId}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-col gap-y-4"
                >
                  <p>Where to send</p>
                  <FormField_Shadcn_
                    name="type"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Type</FormLabel_Shadcn_>
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
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  ></FormField_Shadcn_>
                  <FormField_Shadcn_
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Name</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} placeholder="Name" />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  <FormField_Shadcn_
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Project Id</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} placeholder="Project id" />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  <FormField_Shadcn_
                    control={form.control}
                    name="datasetId"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Dataset Id</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ {...field} placeholder="Dataset id" />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  <FormField_Shadcn_
                    control={form.control}
                    name="serviceAccountKey"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Service Account Key</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <TextArea_Shadcn_
                            {...field}
                            rows={4}
                            maxLength={5000}
                            placeholder="Service account key"
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  <Separator className="mt-3" />
                  <p>What to send</p>
                  <FormField_Shadcn_
                    control={form.control}
                    name="publicationName"
                    render={({ field }) => (
                      <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                        <FormLabel_Shadcn_>Publication</FormLabel_Shadcn_>
                        <FormControl_Shadcn_>
                          <PublicationsComboBox
                            publications={publications?.map((pub) => pub.name) || []}
                            loading={loadingPublications}
                            field={field}
                            onNewPublicationClick={() => setPublicationPanelVisible(true)}
                          />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItem_Shadcn_>
                    )}
                  />
                  <Separator className="mt-3" />
                  <Accordion_Shadcn_ type="single" collapsible>
                    <AccordionItem_Shadcn_ value="item-1" className="border-none">
                      <AccordionTrigger_Shadcn_ className="font-normal gap-2 justify-start py-1">
                        Advanced Settings
                      </AccordionTrigger_Shadcn_>
                      <AccordionContent_Shadcn_ asChild className="!pb-0">
                        <div className="flex flex-col gap-y-4 mt-4">
                          <FormField_Shadcn_
                            control={form.control}
                            name="maxSize"
                            render={({ field }) => (
                              <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                                <FormLabel_Shadcn_>Max Size</FormLabel_Shadcn_>
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
                                <FormMessage_Shadcn_ />
                              </FormItem_Shadcn_>
                            )}
                          />
                          <FormField_Shadcn_
                            control={form.control}
                            name="maxFillSecs"
                            render={({ field }) => (
                              <FormItem_Shadcn_ className="flex flex-col gap-y-2">
                                <FormLabel_Shadcn_>Max Fill Seconds</FormLabel_Shadcn_>
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
                                <FormMessage_Shadcn_ />
                              </FormItem_Shadcn_>
                            )}
                          />
                        </div>
                      </AccordionContent_Shadcn_>
                    </AccordionItem_Shadcn_>
                  </Accordion_Shadcn_>
                  <div className="hidden">
                    <FormField_Shadcn_
                      control={form.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem_Shadcn_ className="flex flex-row justify-between items-center p-4">
                          <FormLabel_Shadcn_>Enabled</FormLabel_Shadcn_>
                          <FormControl_Shadcn_>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={field.disabled}
                            />
                          </FormControl_Shadcn_>
                          <FormMessage_Shadcn_ />
                        </FormItem_Shadcn_>
                      )}
                    />
                  </div>
                </form>
              </Form_Shadcn_>
            </SheetSection>
            <SheetFooter>
              <Button disabled={isCreating} type="default" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={isCreating} loading={isCreating} form={formId} htmlType="submit">
                {isEditing ? 'Update' : 'Create'}
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

export default DestinationPanel
