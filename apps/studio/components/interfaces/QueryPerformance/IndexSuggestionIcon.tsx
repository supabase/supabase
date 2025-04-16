import { Tooltip, TooltipContent, TooltipTrigger, WarningIcon } from 'ui'

export const IndexSuggestionIcon = () => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <WarningIcon />
      </TooltipTrigger>
      <TooltipContent>Index improvements available</TooltipContent>
    </Tooltip>
  )
}
