'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { cn } from 'ui'

import { useMobileSidebar } from '@/hooks/use-mobile-sidebar'
import { SidebarNavItem } from '@/types/nav'

export const NavigationItem: React.FC<{ item: SidebarNavItem }> = React.memo(({ item }) => {
  const pathname = usePathname()
  const { setOpen } = useMobileSidebar()

  const isActive = pathname === item.href

  const handleClick = () => {
    setOpen(false)
  }

  return (
    <Link
      href={`${item.href}`}
      onClick={handleClick}
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
