'use client'

import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'

import { useFramework } from '@/context/framework-context'
import { useMobileMenu } from '@/hooks/use-mobile-menu'
import { SidebarNavItem } from '@/types/nav'
import { Badge, cn } from 'ui'

// We extend:
// 1. LinkProps - for Next.js Link component props (prefetch, etc)
// 2. AnchorHTMLAttributes - for standard HTML anchor props (className, etc)
// We omit href from both since we compute it internally from item.href
interface NavigationItemProps
  extends Omit<LinkProps, 'href'>,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  item: SidebarNavItem
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  level?: number
}

const NavigationItem: React.FC<NavigationItemProps> = ({ item, onClick, level = 0, ...props }) => {
  const { setOpen } = useMobileMenu()
  const { framework } = useFramework()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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

  const hasChildren = item.items && item.items.length > 0

  // Auto-expand if any child is active
  useEffect(() => {
    if (hasChildren) {
      const hasActiveChild = item.items?.some((child) => {
        let childHref = child.href
        if (child.supportedFrameworks && childHref && childHref.startsWith('/docs/')) {
          const hrefParts = childHref.split('/').filter(Boolean)
          if (
            hrefParts.length >= 3 &&
            framework &&
            isFrameworkSupported(child, String(framework))
          ) {
            const pathSegment = hrefParts[2]
            if (pathSegment) {
              childHref = `/docs/${String(framework)}/${pathSegment}`
            }
          }
        }
        return pathname === childHref
      })
      if (hasActiveChild) {
        setIsOpen(true)
      }
    }
  }, [hasChildren, item.items, pathname, framework])

  // Build URL with priority:
  // 1. item.href if available (replacing any existing framework with current one)
  // 2. Computed from current path considering framework support
  let href = item.href

  // Only modify URLs for items that explicitly support frameworks
  if (item.supportedFrameworks) {
    if (href && href.startsWith('/docs/')) {
      const hrefParts = href.split('/').filter(Boolean)
      if (hrefParts.length >= 3 && framework && isFrameworkSupported(item, String(framework))) {
        const pathSegment = hrefParts[2]
        if (pathSegment) {
          href = `/docs/${String(framework)}/${pathSegment}`
        }
      }
    }
  }
  // Handle component items with slug but no href
  else if (!href && slug) {
    // Build the URL using the current framework if it's supported
    if (framework && isFrameworkSupported(item, String(framework))) {
      href = `/docs/${String(framework)}/${slug}`
    } else {
      // Fall back to framework-agnostic URL when framework not supported
      href = `/docs/${slug}`
    }
  }

  // Determine if this link represents the current page
  const isActive = pathname === href

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If item has children, toggle open/close instead of navigating
    if (hasChildren) {
      e.preventDefault()
      setIsOpen(!isOpen)
      return
    }

    // Close the mobile menu when navigating
    setOpen(false)

    // Call the onClick prop if it exists
    if (onClick) {
      onClick(e)
    }
  }

  const paddingLeft = level > 0 ? 6 + level * 12 : 6

  return (
    <div>
      <Link
        href={hasChildren ? '#' : href || '#'}
        {...props}
        onClick={handleClick}
        className={cn(
          'relative',
          'flex',
          'items-center justify-between',
          'h-6',
          'text-sm',
          'text-foreground-lighter',
          !isActive && 'hover:bg-surface-100 hover:text-foreground',
          isActive && 'bg-surface-200 text-foreground',
          'transition-all',
          props.className
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* Active indicator bar */}
        <div
          className={cn(
            'transition',
            'absolute left-0 w-1 h-full bg-foreground',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren && (
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform flex-shrink-0',
                isOpen && 'transform rotate-90'
              )}
            />
          )}
          <span className="truncate">{item.title}</span>
        </div>
        {item.new && (
          <Badge variant="brand" className="capitalize flex-shrink-0">
            NEW
          </Badge>
        )}
      </Link>
      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {item.items?.map((childItem, i) => (
            <NavigationItem item={childItem} key={`${childItem.href}-${i}`} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

NavigationItem.displayName = 'NavigationItem'

export default NavigationItem
