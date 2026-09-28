'use client'

import { cva } from 'class-variance-authority'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import type { DropdownMenuItem } from '../Navigation.types'
import { MenuItem } from './GlobalNavigationMenu'
import { GLOBAL_MENU_ITEMS } from './NavigationMenu.constants'

interface DocsSidebarTreeProps {
  className?: string
}

interface SidebarGroupProps {
  section: DropdownMenuItem
  pathname: string
}

interface SidebarLinkProps {
  item: DropdownMenuItem
  isActive: boolean
}

const sectionItemVariants = cva(
  'flex h-8 items-center text-sm font-medium transition-colors focus-ring rounded-md',
  {
    variants: {
      isActive: {
        true: 'text-foreground',
        false: 'text-foreground-light hover:text-foreground',
      },
    },
  }
)

const isEnabled = (item: DropdownMenuItem) => item.enabled !== false

const isActiveHref = (href: string | undefined, pathname: string) => {
  if (!href?.startsWith('/')) return false
  const sectionPrefix = href.split('/').slice(0, 3).join('/')
  return pathname === sectionPrefix || pathname.startsWith(`${sectionPrefix}/`)
}

export const DocsSidebarTree = ({ className }: DocsSidebarTreeProps) => {
  const pathname = usePathname() ?? ''
  const sections = GLOBAL_MENU_ITEMS.map(([section]) => section).filter(isEnabled)

  return (
    <nav aria-label="Docs sections" className={cn('flex flex-col', className)}>
      {sections.map((section) =>
        section.menuItems ? (
          <SidebarGroup key={section.label} section={section} pathname={pathname} />
        ) : (
          <Link
            key={section.label}
            href={section.href ?? '/'}
            className={sectionItemVariants({ isActive: isActiveHref(section.href, pathname) })}
          >
            {section.label}
          </Link>
        )
      )}
    </nav>
  )
}

const SidebarGroup = ({ section, pathname }: SidebarGroupProps) => {
  const groups = (section.menuItems ?? []).map((group) => group.filter(isEnabled))
  const isGroupActive = groups.some((group) =>
    group.some((item) => isActiveHref(item.href, pathname))
  )

  return (
    <Collapsible defaultOpen={isGroupActive}>
      <CollapsibleTrigger
        className={cn(sectionItemVariants({ isActive: isGroupActive }), 'group w-full gap-1.5')}
      >
        {section.label}
        <ChevronRight
          size={14}
          strokeWidth={2}
          aria-hidden
          className="text-foreground-muted transition-transform duration-150 group-data-[state=open]:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="ml-px flex flex-col border-l pb-1">
          {groups.map((group, groupIdx) =>
            group.map((item) => (
              <li
                key={`${section.label}-${item.label}`}
                className={cn(groupIdx > 0 && item === group[0] && 'pt-2')}
              >
                {item.href ? (
                  <SidebarLink item={item} isActive={isActiveHref(item.href, pathname)} />
                ) : (
                  <span className="flex h-7 items-end pb-1 pl-3 font-mono text-xs uppercase tracking-wider text-foreground-muted">
                    {item.label}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

const SidebarLink = ({ item, isActive }: SidebarLinkProps) => (
  <MenuItem
    href={item.href}
    title={item.label}
    icon={item.icon}
    community={item.community}
    new={item.new}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'relative pl-3 rounded-l-none',
      isActive &&
        'bg-surface-200 text-foreground before:absolute before:-left-px before:top-1/2 before:h-4 before:w-px before:-translate-y-1/2 before:bg-brand'
    )}
  />
)
