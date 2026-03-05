'use client'

import { ChevronRight, Lock } from 'lucide-react'
import Link, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Badge, cn } from 'ui'

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
  level?: number
  internalPaths?: string[]
  isLoggedIn?: boolean
}

const NavigationItem = ({
  item,
  onClick,
  level = 0,
  internalPaths,
  isLoggedIn = true,
  ...props
}: NavigationItemProps) => {
  const { setOpen } = useMobileMenu()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const pathParts = pathname.split('/')
  const slug = pathParts[pathParts.length - 1]

  const hasChildren = item.items && item.items.length > 0

  // Check if internal content exists for this item and user is logged in
  const hasInternal = item.href && internalPaths?.includes(item.href) && isLoggedIn

  // Auto-expand if any child or nested child is active
  useEffect(() => {
    if (hasChildren) {
      const hasActiveChild = (items: typeof item.items): boolean => {
        return (
          items?.some((child) => {
            if (pathname === child.href) return true
            if (child.items && child.items.length > 0) {
              return hasActiveChild(child.items)
            }
            return false
          }) ?? false
        )
      }

      if (hasActiveChild(item.items)) {
        setIsOpen(true)
      }
    }
  }, [hasChildren, item.items, pathname])

  // Use item.href if available, otherwise build from slug
  let href = item.href
  if (!href && slug) {
    href = `/docs/${slug}`
  }

  // Determine if this link represents the current page
  const isActive = pathname === href

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Close the mobile menu when navigating
    setOpen(false)

    // Call the onClick prop if it exists
    if (onClick) {
      onClick(e)
    }
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  const itemClasses = cn(
    'flex text-sm rounded-md transition-colors',
    // Course level (0)
    level === 0 && 'px-3 py-2 font-semibold',
    // Module level (1)
    level === 1 && 'px-3 py-2 font-medium text-xs text-foreground-muted',
    // Chapter level (2+)
    level >= 2 && 'px-3 py-1.5 text-sm',
    isActive
      ? 'bg-surface-200 text-foreground'
      : hasChildren && isOpen
        ? 'bg-surface-100 text-foreground'
        : 'text-foreground-lighter hover:bg-surface-100 hover:text-foreground'
  )

  return (
    <li>
      {hasChildren ? (
        <>
          <button
            onClick={handleButtonClick}
            className={cn('w-full flex items-center justify-between gap-2 zans', itemClasses)}
          >
            <span className="flex items-center gap-2 flex-1 min-w-0">
              {item.title}
              {item.new && (
                <Badge variant="default" className="capitalize flex-shrink-0">
                  NEW
                </Badge>
              )}
            </span>
            <ChevronRight
              className={cn(
                'w-4 h-4 transition-transform flex-shrink-0',
                isOpen && 'rotate-90',
                (hasChildren && isOpen) || isActive ? 'text-foreground' : 'text-foreground-lighter'
              )}
            />
          </button>
          {isOpen && (
            <ul className="mt-1 ml-3 space-y-1 border-l border-border pl-3">
              {item.items?.map((childItem, i) => (
                <NavigationItem
                  item={childItem}
                  key={`${childItem.href}-${i}`}
                  level={level + 1}
                  internalPaths={internalPaths}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <Link href={href || '#'} {...props} onClick={handleLinkClick} className={itemClasses}>
            <span className="flex items-center gap-2">
              <span className="truncate">{item.title}</span>
              {item.new && (
                <Badge variant="default" className="capitalize flex-shrink-0">
                  NEW
                </Badge>
              )}
            </span>
          </Link>
          {hasInternal && (
            <Link
              href={`/internal${href}`}
              onClick={handleLinkClick}
              className={cn(
                'flex text-sm rounded-md transition-colors mt-1',
                level === 0 ? 'px-3 py-2' : 'px-3 py-1.5',
                pathname === `/internal${href}`
                  ? 'bg-surface-200 text-foreground'
                  : 'text-foreground-lighter hover:bg-surface-100 hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-foreground-muted flex-shrink-0" />
                <span className="truncate">{item.title} (Internal)</span>
              </span>
            </Link>
          )}
        </>
      )}
    </li>
  )
}

NavigationItem.displayName = 'NavigationItem'

export { NavigationItem }
