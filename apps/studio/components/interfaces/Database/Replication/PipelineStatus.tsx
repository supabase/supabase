import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { cn } from 'ui'
import { ResponseError } from 'types'

export interface PipelineStatusProps {
  pipelineStatus: string | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

const PipelineStatus = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  isSuccess,
}: PipelineStatusProps) => {
  const pipelineEnabled = pipelineStatus === 'Stopped' ? false : true
  const status = pipelineStatus === 'Stopped' ? 'Disabled' : 'Enabled'
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
