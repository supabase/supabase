import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

export default function TooltipInlineDemo() {
  return (
    <TooltipProvider>
      <p className="text-sm">
        This app requests{' '}
        <Tooltip>
          <TooltipTrigger className="cursor-help underline decoration-dotted decoration-foreground-muted/50 hover:decoration-foreground-muted transition-colors underline-offset-[3px]">
            Database management
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-60">
            Access database settings. Write access also allows the app to run SQL.
          </TooltipContent>
        </Tooltip>
        .
      </p>
    </TooltipProvider>
  )
}
