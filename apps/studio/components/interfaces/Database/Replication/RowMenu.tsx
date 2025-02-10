import AlertError from 'components/ui/AlertError'
import { Edit, MoreVertical, Pause, Play, Trash } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { PipelineStatusProps } from './PipelineStatus'

const RowMenu = ({ pipelineStatus, error, isLoading, isError, isSuccess }: PipelineStatusProps) => {
  const pipelineEnabled = pipelineStatus === 'Stopped' ? false : true
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
