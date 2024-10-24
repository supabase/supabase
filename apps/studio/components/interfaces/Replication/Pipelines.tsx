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

  const { mutate: startPipeline, isLoading: isStartingPipeline } = useStartPipelineMutation({
    onSuccess: (res) => {
      toast.success('Successfully started pipeline')
    },
  })
  const { mutate: stopPipeline, isLoading: isStoppingPipeline } = useStopPipelineMutation({
    onSuccess: (res) => {
      toast.success('Successfully stopped pipeline')
    },
  })
  const [showCreatePipelineModal, setShowCreatePipelineModal] = useState(false)
  const [showDeletePipelineModal, setShowDeletePipelineModal] = useState(false)
  const [pipelineIdToDelete, setPipelineIdToDelete] = useState(-1)

  const pipelines = pipelines_data ?? []

  const replicationStatuses = useReplicationPipelinesStatuesQuery({
    projectRef: ref,
    pipelineIds: pipelines.map((pipeline) => pipeline.id),
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
                    <Table.th key="id">Id</Table.th>,
                    <Table.th key="source_id">Source Id</Table.th>,
                    <Table.th key="sink_id">Sink Id</Table.th>,
                    <Table.th key="action">Action</Table.th>,
                    <Table.th key="edit">Edit</Table.th>,
                    <Table.th key="delete">Delete</Table.th>,
                  ]}
                  body={
                    pipelines.length === 0 ? (
                      <Table.tr>
                        <Table.td align="center" colSpan={6}>
                          No pipelines
                        </Table.td>
                      </Table.tr>
                    ) : (
                      pipelines.map((pipeline) => {
                        const status = pipelineIdToStatus.get(`${pipeline.id}`)
                        const actionButtonLoading =
                          !status ||
                          status === 'Starting' ||
                          status === 'Stopping' ||
                          isStartingPipeline ||
                          isStoppingPipeline
                        const actionButtonLabel =
                          isStartingPipeline || status === 'Starting'
                            ? 'Starting Pipeline'
                            : isStoppingPipeline || status === 'Stopping'
                              ? 'Stopping Pipeline'
                              : actionButtonLoading
                                ? 'Getting Status'
                                : status === 'Stopped'
                                  ? 'Start'
                                  : 'Stop'
                        return (
                          <Table.tr key={pipeline.id}>
                            <Table.td>{pipeline.id}</Table.td>
                            <Table.td>{pipeline.source_id}</Table.td>
                            <Table.td>{pipeline.sink_id}</Table.td>
                            <Table.td>
                              <Button
                                onClick={() => {
                                  if (actionButtonLabel === 'Start') {
                                    startPipeline({ projectRef: ref!, pipeline_id: pipeline.id })
                                  } else if (actionButtonLabel === 'Stop') {
                                    stopPipeline({ projectRef: ref!, pipeline_id: pipeline.id })
                                  }
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
