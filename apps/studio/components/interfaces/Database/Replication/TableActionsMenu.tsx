import { AlertCircle, MoreVertical, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface TableActionsMenuProps {
  tableId: number
  tableName: string
  tableState: {
    name: string
    [key: string]: any
  }
  onRestartClick: () => void
  onShowErrorClick?: () => void
  disabled?: boolean
}

export const TableActionsMenu = ({
  tableId,
  tableName,
  tableState,
  onRestartClick,
  onShowErrorClick,
  disabled = false,
}: TableActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const isErrored = tableState.name === 'error'
  const hasErrorDetails = isErrored && 'reason' in tableState

  const handleRestartClick = () => {
    setIsOpen(false)
    onRestartClick()
  }

  const handleShowErrorClick = () => {
    setIsOpen(false)
    onShowErrorClick?.()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="default"
          className="px-1.5"
          icon={<MoreVertical />}
          disabled={disabled}
          aria-label={`Actions for ${tableName}`}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end" className="w-52">
        {hasErrorDetails && (
          <>
            <DropdownMenuItem className="space-x-2" onClick={handleShowErrorClick}>
              <AlertCircle size={14} />
              <p>Show error</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem className="space-x-2" onClick={handleRestartClick}>
          <RotateCcw size={14} />
          <p>Restart table replication</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
