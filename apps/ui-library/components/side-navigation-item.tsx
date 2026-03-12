'use client'

import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { Badge, cn } from 'ui'

import { useFramework } from '@/context/framework-context'
import { useMobileMenu } from '@/hooks/use-mobile-menu'
import { SidebarNavItem } from '@/types/nav'

// We extend:
// 1. LinkProps - for Next.js Link component props (prefetch, etc)
// 2. AnchorHTMLAttributes - for standard HTML anchor props (className, etc)
// We omit href from both since we compute it internally from item.href
interface NavigationItemProps
  extends Omit<LinkProps, 'href'>,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  item: SidebarNavItem
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

const NavigationItem: React.FC<NavigationItemProps> = ({ item, onClick, ...props }) => {
  const { setOpen } = useMobileMenu()
  const { framework } = useFramework()
  const pathname = usePathname()

  const pathParts = pathname.split('/')
  const slug = pathParts[pathParts.length - 1]

  // Helper function to check if a framework is supported for a navigation item
  const isFrameworkSupported = (item: SidebarNavItem, framework: string) => {
    const supportedFrameworks = item.supportedFrameworks || []
    const hasFrameworkRestrictions = supportedFrameworks.length > 0

    // An item supports the current framework if either:
    // 1. It has no framework restrictions (supports all frameworks)
    // 2. The current framework is in its list of supported frameworks
    return !hasFrameworkRestrictions || supportedFrameworks.includes(framework as any)
  }

  // Build URL with priority:
  // 1. item.href if available (replacing any existing framework with current one)
  // 2. Computed from current path considering framework support
  let href = item.href

  // Only modify URLs for items that explicitly support frameworks
  if (item.supportedFrameworks) {
    if (href && href.startsWith('/docs/')) {
      const hrefParts = href.split('/')
      if (hrefParts.length >= 3) {
        if (framework && isFrameworkSupported(item, framework)) {
          if (hrefParts.length >= 4) {
            href = `/docs/${framework}/${hrefParts[3]}`
          }
        }
      }
    }
  }
  // Handle component items with slug but no href
  else if (!href && slug) {
    // Build the URL using the current framework if it's supported
    if (framework && isFrameworkSupported(item, framework)) {
      href = `/docs/${framework}/${slug}`
    } else {
      // Fall back to framework-agnostic URL when framework not supported
      href = `/docs/${slug}`
    }
  }

  // Determine if this link represents the current page
  const isActive = pathname === href

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Close the mobile menu when navigating
    setOpen(false)

    // Call the onClick prop if it exists
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <Link
      href={href || '#'}
      {...props}
      onClick={handleClick}
      className={cn(
        'relative',
        'flex',
        'items-center justify-between',
        'h-6',
        'text-sm',
        'text-foreground-lighter px-6',
        !isActive && 'hover:bg-surface-100 hover:text-foreground',
        isActive && 'bg-surface-200 text-foreground',
        'transition-all',
        props.className
      )}
    >
      {/* Active indicator bar */}
      <div
        className={cn(
          'transition',
          'absolute left-0 w-1 h-full bg-foreground',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
      />
      {item.title}
      {item.new && <Badge variant="success">New</Badge>}
    </Link>
  )
}

NavigationItem.displayName = 'NavigationItem'

export default NavigationItem
