import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

export default function TooltipInlineDemo() {
  return (
    <TooltipProvider>
      <p className="text-sm">
        This app is requesting{' '}
        <Tooltip>
          <TooltipTrigger className="cursor-help underline decoration-dotted decoration-foreground-muted/50 hover:decoration-foreground-muted transition-colors underline-offset-[3px]">
            database management
          </TooltipTrigger>
          <TooltipContent className="max-w-60">
            Access database settings. Write access also allows the app to run SQL.
          </TooltipContent>
        </Tooltip>
        .
      </p>
    </TooltipProvider>
  )
}
