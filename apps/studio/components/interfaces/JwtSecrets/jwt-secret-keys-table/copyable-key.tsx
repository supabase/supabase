import { CheckIcon, CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { copyToClipboard, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export const CopyableKey = ({ keyId }: { keyId: string }) => {
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return
    const timer = setTimeout(() => setIsCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [isCopied])

  const handleCopy = () => {
    copyToClipboard(keyId, () => setIsCopied(true))
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={0}
            onClick={handleCopy}
            className="flex w-fit items-center gap-x-1 cursor-pointer group font-mono text-xs text-foreground-lighter mt-1"
          >
            {keyId}
            {isCopied ? (
              <CheckIcon size={12} strokeWidth={1.25} className="text-primary" />
            ) : (
              <CopyIcon
                size={12}
                strokeWidth={1.25}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Copy key</TooltipContent>
      </Tooltip>
      <span role="status" aria-live="polite" className="sr-only">
        {isCopied ? 'Key copied to clipboard' : ''}
      </span>
    </>
  )
}
