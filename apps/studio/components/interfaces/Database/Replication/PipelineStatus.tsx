import { useParams } from 'common'
import { Pipeline } from './DestinationRow'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'

const PipelineStatus = ({ pipeline }: { pipeline: Pipeline }) => {
  const { ref: projectRef } = useParams()
  const { data, error, isLoading, isError, isSuccess } = useReplicationPipelineStatusQuery({
    projectRef,
    pipelineId: pipeline.id,
  })
  const pipelineEnabled = data?.status === 'Stopped' ? false : true
  const status = data?.status === 'Stopped' ? 'Disabled' : 'Enabled'
  return (
    <>
      {isLoading && <ShimmeringLoader></ShimmeringLoader>}
      {isError && <AlertError error={error} subject="Failed to retrieve pipeline status" />}
      {isSuccess && (
        <div className="flex flex-row items-center">
          <div
            className={cn(
              'w-2 h-2 rounded-full mr-1',
              pipelineEnabled ? 'bg-brand' : 'bg-warning-600'
            )}
          ></div>
          {status}
        </div>
      )}
    </>
  )
}

export default PipelineStatus
