import { useParams } from 'common'
import { Pipeline } from './DestinationRow'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

const PipelineStatus = ({ pipeline }: { pipeline: Pipeline }) => {
  const { ref: projectRef } = useParams()
  const { data, error, isLoading, isError, isSuccess } = useReplicationPipelineStatusQuery({
    projectRef,
    pipelineId: pipeline.id,
  })
  const status = data?.status === 'Stopped' ? 'Disabled' : 'Enabled'
  return (
    <>
      {isLoading && <ShimmeringLoader></ShimmeringLoader>}
      {isError && <AlertError error={error} subject="Failed to retrieve pipeline status" />}
      {isSuccess && <>{status}</>}
    </>
  )
}

export default PipelineStatus
