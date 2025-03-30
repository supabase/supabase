'use client'

import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { SidebarNavItem } from '@/types/nav'
import { cn } from 'ui'

// We extend:
// 1. LinkProps - for Next.js Link component props (href, prefetch, etc)
// 2. AnchorHTMLAttributes - for standard HTML anchor props (className, etc)
// We omit 'href' from AnchorHTMLAttributes to avoid conflict with LinkProps href
interface NavigationItemProps
  extends LinkProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  item: SidebarNavItem
}

const NavigationItem: React.FC<NavigationItemProps> = ({ item, href: propHref, ...props }) => {
  const pathname = usePathname()
  const pathParts = pathname.split('/')
  const slug = pathParts[pathParts.length - 1]
  const framework = pathParts[pathParts.length - 2]

  // Build URL with priority:
  // 1. item.href if available
  // 2. Computed from current path (slug + framework)
  // 3. Override href prop if provided
  let href = propHref || item.href
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
      {...props}
      className={cn(
        'relative',
        'flex',
        'items-center',
        'h-6',
        'text-sm',
        'text-foreground-lighter px-6',
        !isActive && 'hover:bg-surface-100 hover:text-foreground',
        isActive && 'bg-surface-200 text-foreground',
        'transition-all',
        props.className
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
}

NavigationItem.displayName = 'NavigationItem'

export default NavigationItem
