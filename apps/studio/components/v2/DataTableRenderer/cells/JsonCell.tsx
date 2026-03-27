import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface JsonCellProps {
  value: unknown
}

function tryStringify(val: unknown): string {
  if (typeof val === 'string') return val
  try {
    return JSON.stringify(val)
  } catch {
    return String(val)
  }
}

function tryPretty(val: unknown): string {
  if (typeof val === 'string') {
    try {
      return JSON.stringify(JSON.parse(val), null, 2)
    } catch {
      return val
    }
  }
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

export function JsonCell({ value }: JsonCellProps) {
  const [expanded, setExpanded] = useState(false)

  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">NULL</span>
  }

  const compact = tryStringify(value)
  const pretty = tryPretty(value)

  if (expanded) {
    return (
      <pre
        className="font-mono text-[11px] text-foreground-light bg-surface-200 rounded p-1 max-h-40 overflow-auto whitespace-pre-wrap cursor-pointer"
        onClick={() => setExpanded(false)}
      >
        {pretty}
      </pre>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="font-mono text-[12px] text-foreground-light truncate cursor-pointer hover:text-foreground"
          onClick={() => setExpanded(true)}
        >
          {compact}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <pre className="font-mono text-[11px] whitespace-pre-wrap">{pretty}</pre>
      </TooltipContent>
    </Tooltip>
  )
}
