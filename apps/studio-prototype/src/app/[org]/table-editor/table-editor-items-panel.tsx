'use client'

import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'

export default function TableEditorItemsPanel() {
  const { org } = useParams()
  const pathname = usePathname()
  const isActive = pathname === `/${org}/table-editor`

  return (
    <div
      className={cn(
        'h-full',
        //
        isActive ? 'w-[300px]' : 'w-[0px]',
        isActive &&
          `
        border-r 
        `,
        'duration-500',
        'ease-out',
        'transition-all'
      )}
    >
      hello world
    </div>
  )
}
