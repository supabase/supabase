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
  expandedSections: Set<string>
}

interface RecursiveNavigationProps {
  items: NavMenuSection[]
  className?: string
}

const ICON_SIZE = 16

// URL-driven expansion state - determines which sections should be open based on current pathname
const useUrlDrivenExpansion = (items: NavMenuSection[], pathname: string) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    // Find all sections that should be expanded to show the current page
    const sectionsToExpand = getSectionsContainingPath(items, pathname)
    setExpandedSections(new Set(sectionsToExpand))
  }, [pathname, items])

  return expandedSections
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

// Get all sections that should be expanded to show the current pathname
const getSectionsContainingPath = (items: NavMenuSection[], pathname: string): string[] => {
  const sectionsToExpand: string[] = []
  
  const findSections = (items: NavMenuSection[], currentPath = '') => {
    items.forEach(item => {
      const itemPath = currentPath ? `${currentPath}.${item.name}` : item.name
      
      // If this item contains the active path, add it to expanded sections
      if (containsActivePath(item, pathname)) {
        sectionsToExpand.push(itemPath)
        
        // Recursively check children
        if (item.items && item.items.length > 0) {
          findSections(item.items as NavMenuSection[], itemPath)
        }
      }
    })
  }
  
  findSections(items)
  return sectionsToExpand
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

const RecursiveNavItem = React.memo<RecursiveNavItemProps>(({ item, depth = 0, path = '', expandedSections }) => {
  const pathname = usePathname()
  const itemPath = path ? `${path}.${item.name}` : item.name
  const isActive = item.url === pathname
  const hasChildren = item.items && item.items.length > 0
  
  // URL-driven expansion: section is open if it contains the current pathname
  const isOpen = expandedSections.has(itemPath)

  if (item.enabled === false) {
    return null
  }

  if (hasChildren) {
    return (
      <div className={cn('w-full', depth > 0 && 'ml-2')}>
        <div
          className={cn(
            'flex items-center justify-between w-full py-2 px-3 rounded-md',
            'text-sm transition-colors',
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
        </div>

        {isOpen && (
          <div className="overflow-hidden transition-all duration-500 ease-in-out">
            <div className="pt-1 pb-2 pl-4 space-y-1 border-l border-border ml-2">
              {item.items?.map((child, index) => (
                <RecursiveNavItem
                  key={child.url || `${child.name}-${index}`}
                  item={child as NavMenuSection}
                  depth={depth + 1}
                  path={itemPath}
                  expandedSections={expandedSections}
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
  const expandedSections = useUrlDrivenExpansion(items, pathname)

  return (
    <nav className={cn('w-full space-y-1', className)}>
      {items.map((item, index) => (
        <RecursiveNavItem
          key={item.url || `${item.name}-${index}`}
          item={item}
          expandedSections={expandedSections}
        />
      ))}
    </nav>
  )
}

export { RecursiveNavigation, type NavMenuSection }
export default RecursiveNavigation
