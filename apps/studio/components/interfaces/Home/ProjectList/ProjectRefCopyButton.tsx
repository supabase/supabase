import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { copyToClipboard, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface ProjectRefCopyButtonProps {
  projectRef: string
}

export const ProjectRefCopyButton = ({ projectRef }: ProjectRefCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyProjectRef = (e: React.SyntheticEvent) => {
    // Prevent the parent row/card from navigating
    e.preventDefault()
    e.stopPropagation()
    copyToClipboard(projectRef)
    setIsCopied(true)
    toast.success('Copied project ID to clipboard')
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          tabIndex={0}
          onClick={handleCopyProjectRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCopyProjectRef(e)
            }
          }}
          className="inline-flex self-start items-center gap-x-1 cursor-pointer border border-transparent border-dashed rounded-sm transition-colors hover:bg-surface-100 hover:border hover:border-strong group font-mono text-xs text-foreground-lighter hover:text-foreground-light px-1 -ml-[5px]"
        >
          {projectRef}
          {isCopied ? (
            <Check size={12} strokeWidth={1.25} className="text-primary" />
          ) : (
            <Copy
              size={12}
              strokeWidth={1.25}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>Copy project reference</TooltipContent>
    </Tooltip>
  )
}
