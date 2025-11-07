'use client'

import { SidebarNavItem } from '@/types/nav'
import { cn } from 'ui/src/lib/utils/cn'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

const NavigationItem: React.FC<{ item: SidebarNavItem }> = React.memo(({ item }) => {
  const pathname = usePathname()

  const isActive = pathname === item.href

  return (
    <Link
      href={`${item.href}`}
      className={cn(
        'relative',
        'flex',
        'items-center',
        'h-6',
        'text-sm',
        'text-foreground-lighter px-6',
        !isActive && 'hover:bg-surface-100 hover:text-foreground',
        isActive && 'bg-surface-200 text-foreground',
        'transition-all'
      )}
    >
      <div
        className={cn(
          'transition',
          'absolute left-0 w-1 h-full bg-foreground',

          isActive ? 'opacity-100' : 'opacity-0'
        )}
      ></div>
      {item.title}
    </Link>
  )
})

NavigationItem.displayName = 'NavigationItem'

export default NavigationItem
