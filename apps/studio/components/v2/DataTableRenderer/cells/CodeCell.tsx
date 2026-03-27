import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface CodeCellProps {
  value: unknown
  copyable?: boolean
}

export function CodeCell({ value, copyable = false }: CodeCellProps) {
  const [copied, setCopied] = useState(false)

  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">NULL</span>
  }

  const str = String(value)

  const handleCopy = () => {
    if (!copyable) return
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`font-mono text-[12px] text-foreground-light truncate ${copyable ? 'cursor-pointer hover:text-foreground' : ''}`}
          onClick={copyable ? handleCopy : undefined}
        >
          {copied ? 'Copied!' : str}
        </span>
      </TooltipTrigger>
      {copyable && !copied && (
        <TooltipContent side="top">
          <span className="text-xs">Click to copy</span>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
