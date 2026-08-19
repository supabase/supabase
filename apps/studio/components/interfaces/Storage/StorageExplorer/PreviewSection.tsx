import { ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

interface PreviewSectionProps {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

/** A collapsible section in the file preview panel. */
export const PreviewSection = ({
  title,
  count,
  defaultOpen = false,
  children,
}: PreviewSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          tabIndex={0}
          className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-foreground transition-colors hover:text-foreground-light"
        >
          <span className="flex items-center gap-x-2">
            {title}
            {count !== undefined && (
              <span className="text-xs font-normal text-foreground-lighter">{count}</span>
            )}
          </span>
          <ChevronRight
            size={14}
            className={cn('text-foreground-lighter transition-transform', isOpen && 'rotate-90')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}
