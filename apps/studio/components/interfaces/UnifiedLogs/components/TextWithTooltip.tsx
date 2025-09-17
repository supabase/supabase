import { useEffect, useRef, useState } from 'react'
import { cn, Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger } from 'ui'

interface TextWithTooltipProps {
  text: string | number
  className?: string
}

export function TextWithTooltip({ text, className }: TextWithTooltipProps) {
  const [isTruncated, setIsTruncated] = useState<boolean>(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const { scrollWidth, clientWidth } = textRef.current
        setIsTruncated(scrollWidth > clientWidth)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      checkTruncation()
    })

    if (textRef.current) {
      resizeObserver.observe(textRef.current)
    }

    checkTruncation()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <TooltipProvider delayDuration={100} disableHoverableContent>
      <Tooltip>
        <TooltipTrigger disabled={!isTruncated} asChild>
          <div
            ref={textRef}
            className={cn('truncate', !isTruncated && 'pointer-events-none', className)}
          >
            {text}
          </div>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>{text}</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </TooltipProvider>
  )
}
