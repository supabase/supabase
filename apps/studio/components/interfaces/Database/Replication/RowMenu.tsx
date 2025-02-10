import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { Edit, MoreVertical, Pause, Play, Trash } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

const RowMenu = ({ pipeline_id }: { pipeline_id: number }) => {
  const { ref: projectRef } = useParams()
  const { data, error, isLoading, isError, isSuccess } = useReplicationPipelineStatusQuery({
    projectRef,
    pipelineId: pipeline_id,
  })
  const pipelineEnabled = data?.status === 'Stopped' ? false : true
  return (
    <div className="flex justify-end items-center space-x-2">
      {isLoading && <ShimmeringLoader></ShimmeringLoader>}
      {isError && <AlertError error={error} subject="Failed to retrieve pipeline status" />}
      {isSuccess && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" className="px-1" icon={<MoreVertical />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-32">
            {pipelineEnabled ? (
              <DropdownMenuItem className="space-x-2">
                <Pause size={14} />
                <p>Disable</p>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="space-x-2">
                <Play size={14} />
                <p>Enable</p>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="space-x-2">
              <Edit size={14} />
              <p>Edit destination</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="space-x-2">
              <Trash stroke="red" size={14} />
              <p>Delete destination</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export default RowMenu
