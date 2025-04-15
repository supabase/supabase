'use client'

import { Button } from 'ui'
import { useCopyToClipboard } from 'components/interfaces/DataTableDemo/hooks/use-copy-to-clipboard'
import { composeRefs } from 'components/interfaces/DataTableDemo/lib/compose-refs'
import { cn } from 'ui'
import { cva, VariantProps } from 'class-variance-authority'
import { Check, Copy, Plus } from 'lucide-react'
import * as React from 'react'

const containerVariants = cva(
  'peer whitespace-pre-wrap break-all rounded-md border p-2 font-mono text-sm',
  {
    variants: {
      variant: {
        default: 'border-border/50 bg-border/30',
        destructive: 'border-destructive/50 bg-destructive/30',
      },
      defaultVariants: {
        variant: 'default',
      },
    },
  }
)

export interface CopyToClipboardContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  /**
   * If set and the content exceeds the maximum height,
   * a "Show content" button will collapse the full content
   */
  maxHeight?: number
}

export const CopyToClipboardContainer = React.forwardRef<
  HTMLDivElement,
  CopyToClipboardContainerProps
>(({ children, variant, maxHeight, className, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)
  const [collapsible, setCollapsible] = React.useState(!!maxHeight)
  const innerRef = React.useRef<HTMLDivElement>(null)
  const { copy, isCopied } = useCopyToClipboard()

  React.useLayoutEffect(() => {
    if (innerRef.current && maxHeight) {
      // REMINDER: scrollHeight will keep the max possible height of the content
      // if maxHeight is set, we show the button by default and remove it if height is too narrow.
      // That way, we avoid having a layout shift of first showing the full height and then collapsible.
      if (innerRef.current.scrollHeight <= maxHeight) {
        setCollapsible(false)
      }
    }
  }, [innerRef.current, maxHeight])

  return (
    <div
      className="group relative text-left"
      style={
        {
          '--max-height': `${maxHeight}px`,
        } as React.CSSProperties
      }
    >
      <div
        ref={composeRefs(ref, innerRef)}
        className={cn(
          containerVariants({ variant }),
          collapsible && !open ? 'max-h-[var(--max-height)] overflow-hidden' : undefined,
          className
        )}
        {...props}
      >
        {children}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 opacity-0 focus:opacity-100 group-hover:opacity-100 peer-focus:opacity-100"
        onClick={() => {
          const content = innerRef.current?.textContent
          if (content) copy(content)
        }}
      >
        {!isCopied ? <Copy className="h-3 w-3" /> : <Check className="h-3 w-3" />}
      </Button>
      {collapsible && !open ? (
        <div className="absolute inset-x-px bottom-px flex items-center justify-center rounded-b-md bg-gradient-to-b from-background/0 to-background/100">
          <Button
            variant="outline"
            size="sm"
            className="my-1 rounded-full"
            onClick={() => setOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Show content
          </Button>
        </div>
      ) : null}
    </div>
  )
})

CopyToClipboardContainer.displayName = 'CopyToClipboardContainer'
