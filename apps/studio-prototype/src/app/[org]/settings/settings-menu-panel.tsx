'use client'

import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'
import SettingsMenuChildren from './settings-menu-children'

export default function SettingsMenuPanel() {
  const { org } = useParams()
  const pathname = usePathname()
  const isActive = pathname.startsWith(`/${org}/settings`)

  return (
    <div
      className={cn(
        'bg-dash-sidebar',
        'h-full',
        isActive ? 'w-[270px]' : 'w-[0px]',
        isActive && 'border-r',
        'duration-200',
        'ease-out',
        'transition-all'
      )}
    >
      <SettingsMenuChildren />
    </div>
  )
}
