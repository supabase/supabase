'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { cn } from 'ui'

import type { NavMenuSection } from '../Navigation.types'

interface RecursiveNavItemProps {
  item: NavMenuSection
  depth?: number
  path?: string
  autoExpandedItems: Set<string>
}

interface RecursiveNavigationProps {
  items: NavMenuSection[]
  className?: string
}

const ICON_SIZE = 16
const NAV_EXPANSION_PREFIX = 'nav-expansion-'

// Individual item expansion state hook (following the reference pattern)
const usePersistedExpansionState = (itemName: string) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`${NAV_EXPANSION_PREFIX}${itemName}`)
      if (stored !== null) {
        setIsExpanded(JSON.parse(stored))
      }
    } catch (_error) {
      // Silently handle errors
    }
  }, [itemName])

  const setPersistedExpansion = React.useCallback((expanded: boolean) => {
    setIsExpanded(expanded)
    try {
      sessionStorage.setItem(`${NAV_EXPANSION_PREFIX}${itemName}`, JSON.stringify(expanded))
    } catch (_error) {
      // Silently handle errors
    }
  }, [itemName])

  return [isExpanded, setPersistedExpansion] as const
}

// Custom hook for managing accordion state with auto-expansion
const useAccordionState = (items: NavMenuSection[], pathname: string) => {
  const [autoExpandedItems, setAutoExpandedItems] = React.useState<Set<string>>(new Set())

  // Auto-expand sections containing active path
  React.useEffect(() => {
    const pathsToExpand = getPathsContainingActivePage(items, pathname)
    if (pathsToExpand.length > 0) {
      setAutoExpandedItems(new Set(pathsToExpand))
    }
  }, [pathname, items])

  return { autoExpandedItems }
}

const containsActivePath = (item: NavMenuSection, pathname: string): boolean => {
  if (item.url === pathname) {
    return true
  }

  if (item.items && item.items.length > 0) {
    return item.items.some((child) => containsActivePath(child as NavMenuSection, pathname))
  }

  return false
}

// Get all paths that should be expanded to show the active page
const getPathsContainingActivePage = (items: NavMenuSection[], pathname: string): string[] => {
  const paths: string[] = []
  
  const findPaths = (items: NavMenuSection[], currentPath = '') => {
    items.forEach(item => {
      const itemPath = currentPath ? `${currentPath}.${item.name}` : item.name
      
      if (containsActivePath(item, pathname)) {
        paths.push(itemPath)
        
        if (item.items && item.items.length > 0) {
          findPaths(item.items as NavMenuSection[], itemPath)
        }
      }
    })
  }
  
  findPaths(items)
  return paths
}

const NavIcon = React.memo(
  ({ icon, title, hasLightIcon }: { icon: string; title: string; hasLightIcon?: boolean }) => {
    const { resolvedTheme } = useTheme()

    const iconSrc = hasLightIcon
      ? `${icon}${!resolvedTheme?.includes('dark') ? '-light' : ''}.svg`
      : `${icon}.svg`

    return <Image alt={title} src={iconSrc} width={ICON_SIZE} height={ICON_SIZE} />
  }
)

NavIcon.displayName = 'NavIcon'

const RecursiveNavItem = React.memo<RecursiveNavItemProps>(({ item, depth = 0, path = '', autoExpandedItems }) => {
  const pathname = usePathname()
  const itemPath = path ? `${path}.${item.name}` : item.name
  const isActive = item.url === pathname
  const hasChildren = item.items && item.items.length > 0
  
  // Use individual item persistence hook
  const [isExpanded, setPersistedExpansion] = usePersistedExpansionState(itemPath)
  
  // Check if this item should be auto-expanded due to active path
  const shouldAutoExpand = autoExpandedItems.has(itemPath)
  
  // Determine if item should be open (persisted state OR auto-expansion)
  const isOpen = isExpanded || shouldAutoExpand

  if (item.enabled === false) {
    return null
  }

  if (hasChildren) {
    return (
      <div className={cn('w-full', depth > 0 && 'ml-2')}>
        <button
          onClick={() => setPersistedExpansion(!isExpanded)}
          className={cn(
            'flex items-center justify-between w-full py-2 px-3 rounded-md',
            'text-sm transition-colors hover:bg-surface-100',
            'group',
            isActive && 'bg-surface-200 text-brand-link font-medium'
          )}
        >
          <div className="flex items-center gap-2">
            {item.icon && (
              <NavIcon icon={item.icon} title={item.name} hasLightIcon={item.hasLightIcon} />
            )}
            <span className={cn(depth === 0 && 'font-medium', 'text-left')}>{item.name}</span>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 text-foreground-lighter transition-transform duration-200',
              isOpen && 'rotate-90'
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div className="overflow-hidden transition-all duration-500 ease-in-out">
            <div className="pt-1 pb-2 pl-4 space-y-1 border-l border-border ml-2">
              {item.items?.map((child, index) => (
                <RecursiveNavItem
                  key={child.url || `${child.name}-${index}`}
                  item={child as NavMenuSection}
                  depth={depth + 1}
                  path={itemPath}
                  autoExpandedItems={autoExpandedItems}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.url || '#'}
      className={cn(
        'flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-colors',
        'hover:bg-surface-100 hover:text-foreground',
        depth > 0 && 'ml-2',
        isActive ? 'bg-surface-200 text-brand-link font-medium' : 'text-foreground-light'
      )}
    >
      {item.icon && <NavIcon icon={item.icon} title={item.name} hasLightIcon={item.hasLightIcon} />}
      <span>{item.name}</span>
    </Link>
  )
})

RecursiveNavItem.displayName = 'RecursiveNavItem'

const RecursiveNavigation: React.FC<RecursiveNavigationProps> = ({ items, className }) => {
  const pathname = usePathname()
  const { autoExpandedItems } = useAccordionState(items, pathname)

  return (
    <nav className={cn('w-full space-y-1', className)}>
      {items.map((item, index) => (
        <RecursiveNavItem
          key={item.url || `${item.name}-${index}`}
          item={item}
          autoExpandedItems={autoExpandedItems}
        />
      ))}
    </nav>
  )
}

export { RecursiveNavigation, type NavMenuSection }
export default RecursiveNavigation
