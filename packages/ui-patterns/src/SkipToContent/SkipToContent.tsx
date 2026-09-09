import { type ReactNode } from 'react'
import { Button, cn } from 'ui'

export interface SkipToContentProps {
  /** Hash href to the main content landmark, e.g. `#main`. */
  href: string
  children?: ReactNode
  className?: string
}

/**
 * Keyboard-accessible skip link. Hidden until focused via Tab, then slides into view.
 *
 * Callers must provide a matching landmark target with `id`, `tabIndex={-1}`,
 * `outline-hidden`, and `scroll-mt` when a sticky header is present. The
 * landmark itself should not show a visible focus ring.
 */
function SkipToContent({ href, children = 'Skip to content', className }: SkipToContentProps) {
  return (
    <div
      className={cn(
        // w-fit: wrapper is a block div by default and would otherwise span the full content column.
        'fixed top-0 left-[10px] z-[100] w-fit',
        '-translate-y-full focus-within:translate-y-[10px]',
        'transition-transform duration-200 ease-out',
        className
      )}
    >
      <Button size="tiny" variant="default" asChild>
        <a href={href}>{children}</a>
      </Button>
    </div>
  )
}

export { SkipToContent }
