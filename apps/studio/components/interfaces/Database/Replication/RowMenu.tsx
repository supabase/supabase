import AlertError from 'components/ui/AlertError'
import { Edit, MoreVertical, Pause, Play, Trash } from 'lucide-react'
import { ResponseError } from 'types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { PipelineStatusName } from './PipelineStatus'

interface RowMenuProps {
  pipelineStatus: any
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  onEnableClick: () => void
  onDisableClick: () => void
  onEditClick: () => void
  onDeleteClick: () => void
}

const RowMenu = ({
  pipelineStatus,
  error,
  isLoading,
  isError,
  onEnableClick,
  onDisableClick,
  onEditClick,
  onDeleteClick,
}: RowMenuProps) => {
  const getStatusName = (status: any) => {
    if (status && typeof status === 'object' && 'name' in status) {
      return status.name
    }
    return status
  }

  const statusName = getStatusName(pipelineStatus)
  const pipelineEnabled = statusName !== PipelineStatusName.STOPPED

  return (
    <div className="flex justify-end items-center space-x-2">
      {isLoading && <ShimmeringLoader></ShimmeringLoader>}
      {isError && <AlertError error={error} subject="Failed to retrieve pipeline status" />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" className="px-1.5" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-52">
          {pipelineEnabled ? (
            <DropdownMenuItem className="space-x-2" onClick={onDisableClick}>
              <Pause size={14} />
              <p>Disable</p>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="space-x-2" onClick={onEnableClick}>
              <Play size={14} />
              <p>Enable</p>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="space-x-2" onClick={onEditClick}>
            <Edit size={14} />
            <p>Edit destination</p>
          </DropdownMenuItem>
          <DropdownMenuItem className="space-x-2" onClick={onDeleteClick}>
            <Trash stroke="red" size={14} />
            <p>Delete destination</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default RowMenu
