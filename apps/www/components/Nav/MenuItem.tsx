import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React, { type ReactNode } from 'react'
import { Badge, cn } from 'ui'

import { isCrossZoneHref } from '@/lib/cross-zone'

interface MenuItemContentProps {
  title?: string
  description?: string
  icon?: string | ReactNode
  hasChevron?: boolean
  badge?: {
    label: string
    variant?: 'default' | 'warning' | 'success' | 'destructive' | 'secondary'
  }
}

// cross-zone pages live in another app, so client-side navigation cannot reach them
export const getLinkComponent = (href: string) => (isCrossZoneHref(href) ? 'a' : Link)

const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & Omit<MenuItemContentProps, 'icon'> & { icon?: string }
>(
  (
    { className, title, href = '', description, icon, hasChevron, children, badge, ...props },
    ref
  ) => {
    const content = children ?? (
      <MenuItemContent
        title={title}
        description={description}
        icon={icon}
        hasChevron={hasChevron}
        badge={badge}
      />
    )
    const linkClassName = cn(
      'group/menu-item flex items-center text-foreground-light text-sm hover:text-foreground select-none gap-3 rounded-md p-2 leading-none no-underline focus-ring focus-visible:text-foreground',
      description && 'items-center',
      className
    )
    return isCrossZoneHref(href) ? (
      <a href={href} ref={ref} className={linkClassName} {...props}>
        {content}
      </a>
    ) : (
      <Link href={href} ref={ref} className={linkClassName} {...props}>
        {content}
      </Link>
    )
  }
)

export const MenuItemContent = ({
  title,
  description,
  icon,
  hasChevron,
  badge,
}: MenuItemContentProps) => (
  <>
    {icon ? (
      <div className="shrink-0 border bg-surface-200 min-w-10 w-10 h-10 flex items-center justify-center rounded-lg">
        {typeof icon === 'string' ? (
          <svg
            className="h-5 w-5 group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d={icon}
              stroke="currentColor"
            />
          </svg>
        ) : (
          icon
        )}
      </div>
    ) : null}
    <div className="flex flex-col justify-center">
      <div className="flex items-center gap-1">
        <p className="leading-snug text-foreground">{title}</p>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        {hasChevron && (
          <ChevronRight
            strokeWidth={2}
            className="w-3 h-3 text-foreground transition-all will-change-transform -translate-x-1 opacity-0 group-hover/menu-item:translate-x-0 group-hover/menu-item:opacity-100"
          />
        )}
      </div>
      {description && (
        <p className="line-clamp-2 leading-snug text-foreground-lighter group-hover/menu-item:text-foreground-light group-focus-visible/menu-item:text-foreground-light text-xs">
          {description}
        </p>
      )}
    </div>
  </>
)

export default MenuItem
