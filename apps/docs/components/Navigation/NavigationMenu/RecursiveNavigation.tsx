'use client'

import * as React from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { cn } from 'ui'
import MenuIconPicker from './MenuIconPicker'

interface MenuItem {
  title: string
  icon?: string
  url?: string
  type?: 'link' | 'category' | 'section'
  enabled?: boolean
  children?: MenuItem[]
}

interface RecursiveNavItemProps {
  item: MenuItem
  depth?: number
  path?: string
}

interface RecursiveNavigationProps {
  items: MenuItem[]
  className?: string
}

const RecursiveNavItem: React.FC<RecursiveNavItemProps> = ({ item, depth = 0, path = '' }) => {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()

  const itemPath = path ? `${path}.${item.title}` : item.title
  const isActive = item.url === pathname
  const hasChildren = item.children && item.children.length > 0

  if (item.enabled === false) {
    return null
  }

  if (hasChildren) {
    return (
      <Accordion.Root type="single" collapsible className={cn('w-full', depth > 0 && 'ml-2')}>
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
                <Image
                  alt={item.title}
                  src={`${item.icon}${!resolvedTheme?.includes('dark') ? '-light' : ''}.svg`}
                  width={16}
                  height={16}
                />
              )}
              <span className={cn(depth === 0 && 'font-medium', 'text-left')}>{item.title}</span>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-foreground-lighter transition-transform duration-200"
              aria-hidden="true"
            />
          </Accordion.Trigger>

          <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pt-1 pb-2 pl-4 space-y-1 border-l border-border ml-2">
              {item.children?.map((child, index) => (
                <RecursiveNavItem
                  key={`${child.title}-${index}`}
                  item={child}
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
      {item.icon && (
        <Image
          alt={item.title}
          src={`${item.icon}${!resolvedTheme?.includes('dark') ? '-light' : ''}.svg`}
          width={16}
          height={16}
        />
      )}
      <span>{item.title}</span>
    </Link>
  )
}

const RecursiveNavigation: React.FC<RecursiveNavigationProps> = ({ items, className }) => {
  return (
    <nav className={cn('w-full space-y-1', className)}>
      {items.map((item, index) => (
        <RecursiveNavItem key={`${item.title}-${index}`} item={item} />
      ))}
    </nav>
  )
}

export { RecursiveNavigation, type MenuItem }
export default RecursiveNavigation
