'use client'

import { SidebarNavItem } from '@/types/nav'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { cn } from 'ui'

const NavigationItem: React.FC<{ item: SidebarNavItem }> = React.memo(({ item }) => {
  const pathname = usePathname()
  const pathParts = pathname.split('/')
  const slug = pathParts[pathParts.length - 1]
  const framework = pathParts[pathParts.length - 2]

  // Build URL with framework param if provided
  let href = item.href

  // Handle component items with slug and framework
  if (!href && slug) {
    if (framework) {
      href = `/docs/${framework}/${slug}`
    } else {
      href = `/docs/${slug}`
    }
  }

  const isActive = pathname === href

  return (
    <Link
      href={href || '#'}
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
