import { useQuery } from '@tanstack/react-query'
import { InfoIcon } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { orioleDbUndoSizeQueryOptions } from '@/data/database/orioledb-undo-size-query'
import { formatBytes } from '@/lib/helpers'

type OrioleDbUndoLogSizeProps = {
  projectRef: string
  connectionString?: string | null
}

export const OrioleDbUndoLogSize = ({ projectRef, connectionString }: OrioleDbUndoLogSizeProps) => {
  const { data, isPending, isError, error } = useQuery(
    orioleDbUndoSizeQueryOptions({ projectRef, connectionString })
  )

  if (isError) {
    return (
      <AlertError projectRef={projectRef} error={error} subject="Failed to load undo log size" />
    )
  }

  if (data === null) return null

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm text-foreground-light">
        <span>Undo log size</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="text"
              aria-label="About undo log size"
              className="h-auto p-0 text-foreground-lighter hover:text-foreground"
              icon={<InfoIcon size={14} />}
            />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            Current size of OrioleDB undo log files, which can differ from allocated disk space.
          </TooltipContent>
        </Tooltip>
      </div>
      {isPending ? (
        <ShimmeringLoader className="h-5 w-20" />
      ) : (
        <span className="text-lg font-semibold text-foreground tabular-nums">
          {formatBytes(data, 2)}
        </span>
      )}
    </div>
  )
}
