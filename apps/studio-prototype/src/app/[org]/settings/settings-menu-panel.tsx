'use client'

import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'

export default function SettingsMenuPanel() {
  const { org } = useParams()
  const pathname = usePathname()
  const isActive = pathname === `/${org}/settings`

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
        'duration-200',
        'ease-in-out',
        'transition-all'
      )}
    >
      <span className="text-foreground">items panel</span>
    </div>
  )
}
