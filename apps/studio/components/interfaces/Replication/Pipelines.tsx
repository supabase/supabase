import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'
import { Plus } from 'lucide-react'
import Table from 'components/to-be-cleaned/Table'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { DeletePipelineModal } from './DeletePipepineModal'
import CreatePipelineModal from './CreatePipelineModal'
import { useReplicationPipelinesStatuesQuery } from 'data/replication/pipeline-status-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'

export const ReplicationPipelines = () => {
  const { ref } = useParams()
  const { data: pipelines_data } = useReplicationPipelinesQuery({
    projectRef: ref,
  })

  const { mutate: startPipeline } = useStartPipelineMutation({
    onSuccess: (res) => {
      toast.success('Start pipeline request submitted. Pipeline will start shortly')
    },
  })
  const { mutate: stopPipeline } = useStopPipelineMutation({
    onSuccess: (res) => {
      toast.success('Stop pipeline request submitted. Pipeline will stop shortly')
    },
  })
  const [showCreatePipelineModal, setShowCreatePipelineModal] = useState(false)
  const [showDeletePipelineModal, setShowDeletePipelineModal] = useState(false)
  const [pipelineIdToDelete, setPipelineIdToDelete] = useState(-1)
  const [requestStatuses, setRequestStatuses] = useState(
    new Map<number, 'None' | 'StartRequested' | 'StopRequested'>()
  )
  const [refetchIntervals, setRefetchIntervals] = useState(new Map<number, number | false>())

  const pipelines = pipelines_data ?? []

  const replicationStatuses = useReplicationPipelinesStatuesQuery({
    projectRef: ref,
    statusParams: pipelines.map((pipeline) => {
      let interval = refetchIntervals.get(pipeline.id)
      let refetchInterval = interval === undefined ? false : interval
      return {
        pipelineId: pipeline.id,
        refetchInterval,
      }
    }),
  })

  const pipelineIdToStatus = new Map<string, string>()
  for (const status of replicationStatuses) {
    if (status.error) {
      toast.error('Failed to fetch pipeline status')
    }

    if (status.data) {
      pipelineIdToStatus.set(`${status.data.pipeline_id}`, status.data.status)
    }
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Pipelines"></FormHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <ButtonTooltip
                  className="ml-auto"
                  icon={<Plus />}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: 'Create a pipeline',
                    },
                  }}
                  onClick={() => setShowCreatePipelineModal(true)}
                >
                  New Pipeline
                </ButtonTooltip>
              </div>
              <div className="my-4 w-full">
                <Table
                  head={[
                    <Table.th key="source_name">Source</Table.th>,
                    <Table.th key="sink_name">Sink</Table.th>,
                    <Table.th key="action">Action</Table.th>,
                    <Table.th key="edit">Edit</Table.th>,
                    <Table.th key="delete">Delete</Table.th>,
                  ]}
                  body={
                    pipelines.length === 0 ? (
                      <Table.tr>
                        <Table.td align="center" colSpan={5}>
                          No pipelines
                        </Table.td>
                      </Table.tr>
                    ) : (
                      pipelines.map((pipeline) => {
                        const status = pipelineIdToStatus.get(`${pipeline.id}`)
                        const requestStatus = requestStatuses.get(pipeline.id)
                        const actionButtonLoading =
                          requestStatus === 'StartRequested' || requestStatus === 'StopRequested'
                        const actionButtonLabel =
                          requestStatus === 'StartRequested'
                            ? 'Starting'
                            : requestStatus === 'StopRequested'
                              ? 'Stopping'
                              : status === 'Started'
                                ? 'Stop'
                                : status === 'Stopped'
                                  ? 'Start'
                                  : 'Unknown'

                        if (
                          (requestStatus === 'StartRequested' && status === 'Started') ||
                          (requestStatus === 'StopRequested' && status === 'Stopped')
                        ) {
                          setRefetchIntervals(new Map(refetchIntervals).set(pipeline.id, false))
                          setRequestStatuses(new Map(requestStatuses).set(pipeline.id, 'None'))
                        }
                        return (
                          <Table.tr key={pipeline.id}>
                            <Table.td>This project</Table.td>
                            <Table.td>{pipeline.sink_name}</Table.td>
                            <Table.td>
                              <Button
                                onClick={() => {
                                  if (actionButtonLabel === 'Start') {
                                    startPipeline({ projectRef: ref!, pipeline_id: pipeline.id })
                                    setRequestStatuses(
                                      new Map(requestStatuses).set(pipeline.id, 'StartRequested')
                                    )
                                  } else if (actionButtonLabel === 'Stop') {
                                    stopPipeline({ projectRef: ref!, pipeline_id: pipeline.id })
                                    setRequestStatuses(
                                      new Map(requestStatuses).set(pipeline.id, 'StopRequested')
                                    )
                                  }
                                  setRefetchIntervals(
                                    new Map(refetchIntervals).set(pipeline.id, 3000)
                                  )
                                }}
                                loading={actionButtonLoading}
                              >
                                {actionButtonLabel}
                              </Button>
                            </Table.td>
                            <Table.td>
                              {}
                              <Button
                                type="default"
                                onClick={() => {
                                  toast.info('Editing a pipeline is not yet implemented')
                                }}
                              >
                                Edit
                              </Button>
                            </Table.td>
                            <Table.td>
                              <Button
                                type="danger"
                                onClick={() => {
                                  setPipelineIdToDelete(pipeline.id)
                                  setShowDeletePipelineModal(true)
                                }}
                              >
                                Delete
                              </Button>
                            </Table.td>
                          </Table.tr>
                        )
                      })
                    )
                  }
                ></Table>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <CreatePipelineModal
        visible={showCreatePipelineModal}
        onClose={() => setShowCreatePipelineModal(false)}
      />
      <DeletePipelineModal
        visible={showDeletePipelineModal}
        title={`Delete pipeline with id ${pipelineIdToDelete}?`}
        pipelineId={pipelineIdToDelete}
        onClose={() => setShowDeletePipelineModal(false)}
      />
    </>
  )
}
