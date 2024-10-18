import { PropsWithChildren, useEffect } from 'react'
import { ScrollArea } from 'ui'

interface DropdownScrollAreaProps {
  id?: string
  className?: string
}

// [Joshen] This is a temporary solution to a really odd behavior i've observed with the components in Shadcn
// Specifically if we're using a ScrollArea (or even just anything with overflow) within a DropdownMenu, within a Sheet
// The mouse wheel event to scroll in the ScrollArea is somehow getting ignored in this specific context, hence the fix here

export const DropdownScrollArea = ({
  id,
  className,
  children,
}: PropsWithChildren<DropdownScrollAreaProps>) => {
  useEffect(() => {
    const scrollFix = (e: WheelEvent) => e.stopPropagation()

    if (id) {
      const el = document.getElementById(id)
      if (el) {
        el.addEventListener('wheel', scrollFix, { passive: false })
        return () => el.removeEventListener('wheel', scrollFix)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ScrollArea id={id} className={className}>
      {children}
    </ScrollArea>
  )
}
