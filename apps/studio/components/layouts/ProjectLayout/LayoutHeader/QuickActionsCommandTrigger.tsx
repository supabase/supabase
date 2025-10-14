import { PlusIcon } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns'

const QuickActionsCommandTrigger = () => {
  const setIsOpen = useSetCommandMenuOpen()

  const handleClick = () => {
    setIsOpen(true, 'quick-actions')
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={handleClick} type="primary" className="!p-0 rounded-full w-7 h-7">
          <PlusIcon size={14} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Create</TooltipContent>
    </Tooltip>
  )
}

export default QuickActionsCommandTrigger
