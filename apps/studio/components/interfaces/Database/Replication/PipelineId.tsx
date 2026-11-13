import { cn } from 'ui'

import CopyButton from '@/components/ui/CopyButton'

export const PipelineId = ({
  pipelineId,
  className,
}: {
  pipelineId: string
  className?: string
}) => {
  return (
    <CopyButton
      text={pipelineId}
      aria-label="Copy pipeline ID"
      title={pipelineId}
      variant="text"
      className={cn(
        'h-auto min-w-0 max-w-full rounded-sm px-1.5 py-0.5 font-mono text-xs text-foreground-lighter hover:text-foreground',
        className
      )}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onAuxClick={(event) => event.stopPropagation()}
    >
      <span className="truncate">{`#${pipelineId}`}</span>
    </CopyButton>
  )
}
