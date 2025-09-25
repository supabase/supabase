'use client'

import * as React from 'react'
import * as Accordion from '@radix-ui/react-accordion'
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
}

interface RecursiveNavigationProps {
  items: NavMenuSection[]
  className?: string
}

const ICON_SIZE = 16

const containsActivePath = (item: NavMenuSection, pathname: string): boolean => {
  if (item.url === pathname) {
    return true
  }

  if (item.items && item.items.length > 0) {
    return item.items.some((child) => containsActivePath(child as NavMenuSection, pathname))
  }

  return false
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

const RecursiveNavItem = React.memo<RecursiveNavItemProps>(({ item, depth = 0, path = '' }) => {
  const pathname = usePathname()

  const itemPath = path ? `${path}.${item.name}` : item.name
  const isActive = item.url === pathname
  const hasChildren = item.items && item.items.length > 0
  const containsActive = containsActivePath(item, pathname)

  if (item.enabled === false) {
    return null
  }

  if (hasChildren) {
    return (
      <Accordion.Root
        type="single"
        collapsible
        className={cn('w-full', depth > 0 && 'ml-2')}
        defaultValue={containsActive ? itemPath : undefined}
      >
        <Accordion.Item value={itemPath}>
          <Accordion.Trigger
            className={cn(
              'flex items-center justify-between w-full py-2 px-3 rounded-md',
              'text-sm transition-colors hover:bg-surface-100',
              'group [&[data-state=open]>svg]:rotate-90',
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
              className="h-4 w-4 shrink-0 text-foreground-lighter transition-transform duration-200"
              aria-hidden="true"
            />
          </Accordion.Trigger>

          <Accordion.Content className="overflow-hidden transition-all duration-500 ease-in-out data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pt-1 pb-2 pl-4 space-y-1 border-l border-border ml-2">
              {item.items?.map((child, index) => (
                <RecursiveNavItem
                  key={child.url || `${child.name}-${index}`}
                  item={child as NavMenuSection}
                  depth={depth + 1}
                  path={itemPath}
                />
              ))}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
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
  return (
    <nav className={cn('w-full space-y-1', className)}>
      {items.map((item, index) => (
        <RecursiveNavItem key={item.url || `${item.name}-${index}`} item={item} />
      ))}
    </nav>
  )
}

export { RecursiveNavigation, type NavMenuSection }
export default RecursiveNavigation
