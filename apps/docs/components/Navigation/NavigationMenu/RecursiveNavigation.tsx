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
  toggleItem: (path: string) => void
  isItemOpen: (path: string) => boolean
}

interface RecursiveNavigationProps {
  items: NavMenuSection[]
  className?: string
}

const ICON_SIZE = 16
const NAV_STATE_COOKIE_NAME = 'supabase-docs-nav-state'

// Helper function to set cookie
const setCookie = (name: string, value: string, days = 30) => {
  if (typeof document === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

// Helper function to get cookie
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

// Custom hook for persisted accordion state using cookies
const usePersistedAccordionState = (items: NavMenuSection[], pathname: string) => {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = React.useState(false)

  // Load persisted state from cookies on mount
  React.useEffect(() => {
    try {
      const stored = getCookie(NAV_STATE_COOKIE_NAME)
      if (stored) {
        const parsedState = JSON.parse(stored)
        setOpenItems(new Set(parsedState))
      }
    } catch (error) {
      console.warn('Failed to load navigation state from cookie:', error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Auto-expand sections containing active path (only after initialization)
  React.useEffect(() => {
    if (!isInitialized) return
    
    const pathsToExpand = getPathsContainingActivePage(items, pathname)
    if (pathsToExpand.length > 0) {
      setOpenItems(prev => {
        const newSet = new Set(prev)
        pathsToExpand.forEach(path => newSet.add(path))
        return newSet
      })
    }
  }, [pathname, items, isInitialized])

  // Persist state to cookies whenever it changes (debounced)
  React.useEffect(() => {
    if (!isInitialized) return
    
    try {
      const timeoutId = setTimeout(() => {
        setCookie(NAV_STATE_COOKIE_NAME, JSON.stringify(Array.from(openItems)))
      }, 300) // Debounce for 300ms
      
      return () => clearTimeout(timeoutId)
    } catch (error) {
      console.warn('Failed to save navigation state to cookie:', error)
    }
  }, [openItems, isInitialized])

  const toggleItem = React.useCallback((itemPath: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemPath)) {
        newSet.delete(itemPath)
      } else {
        newSet.add(itemPath)
      }
      return newSet
    })
  }, [])

  const isItemOpen = React.useCallback((itemPath: string) => {
    return openItems.has(itemPath)
  }, [openItems])

  return { toggleItem, isItemOpen, isInitialized }
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

const RecursiveNavItem = React.memo<RecursiveNavItemProps>(({ item, depth = 0, path = '', toggleItem, isItemOpen }) => {
  const pathname = usePathname()

  const itemPath = path ? `${path}.${item.name}` : item.name
  const isActive = item.url === pathname
  const hasChildren = item.items && item.items.length > 0
  const isOpen = isItemOpen(itemPath)

  if (item.enabled === false) {
    return null
  }

  if (hasChildren) {
    return (
      <div className={cn('w-full', depth > 0 && 'ml-2')}>
        <button
          onClick={() => toggleItem(itemPath)}
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
                  toggleItem={toggleItem}
                  isItemOpen={isItemOpen}
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
  const { toggleItem, isItemOpen } = usePersistedAccordionState(items, pathname)

  return (
    <nav className={cn('w-full space-y-1', className)}>
      {items.map((item, index) => (
        <RecursiveNavItem
          key={item.url || `${item.name}-${index}`}
          item={item}
          toggleItem={toggleItem}
          isItemOpen={isItemOpen}
        />
      ))}
    </nav>
  )
}

export { RecursiveNavigation, type NavMenuSection }
export default RecursiveNavigation
