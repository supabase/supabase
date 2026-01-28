import { cn } from 'ui'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface RoleTooltipProps {
  htmlFor: string
  label: string
  description?: string
  className?: string
}

export const RoleTooltip = ({ htmlFor, label, description, className }: RoleTooltipProps) => {
  const labelElement = (
    <label
      htmlFor={htmlFor}
      className={cn('flex items-center gap-x-2 text-xs cursor-pointer', className)}
    >
      <span>{label}</span>
    </label>
  )

  if (!description) {
    return labelElement
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{labelElement}</TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs max-w-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  )
}
