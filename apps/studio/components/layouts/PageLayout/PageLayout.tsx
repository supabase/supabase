import React, { ReactNode } from 'react'
import { cn, NavMenu, NavMenuItem, Button } from 'ui'
import Link from 'next/link'
import { PageHeader } from '.'
import { PAGE_SIZE_CLASSES, type PageSize } from 'ui/src/lib/constants'

export interface NavigationItem {
  id?: string
  label: string
  href?: string
  onClick?: () => void
  icon?: ReactNode
}

interface PageLayoutProps {
  children?: ReactNode
  title?: string
  subtitle?: string
  icon?: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  primaryActions?: ReactNode
  secondaryActions?: ReactNode
  navigationItems?: NavigationItem[]
  className?: string
  size?: PageSize
  isCompact?: boolean
}

const PageLayout = ({
  children,
  title,
  subtitle,
  icon,
  breadcrumbs = [],
  primaryActions,
  secondaryActions,
  navigationItems = [],
  className,
  size = 'default',
  isCompact = false,
}: PageLayoutProps) => {
  return (
    <div className="w-full">
      <div
        className={cn(
          'w-full mx-auto',
          PAGE_SIZE_CLASSES[size],
          size === 'full' && (isCompact ? 'px-6 border-b' : 'pt-8 px-8 border-b'),
          isCompact ? 'pt-4' : 'pt-8',
          navigationItems.length === 0 && size === 'full' && (isCompact ? 'pb-4' : 'pb-8'),
          className
        )}
      >
        {/* Header section */}
        {(title || subtitle || primaryActions || secondaryActions || breadcrumbs.length > 0) && (
          <PageHeader
            title={title}
            subtitle={subtitle}
            icon={icon}
            breadcrumbs={breadcrumbs}
            primaryActions={primaryActions}
            secondaryActions={secondaryActions}
            isCompact={isCompact}
          />
        )}

        {/* Navigation section */}
        {navigationItems.length > 0 && (
          <NavMenu className={cn('mt-4', size === 'full' && 'border-none')}>
            {navigationItems.map((item) => (
              <NavMenuItem key={item.label} active={false}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2"
                    onClick={item.onClick}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                  </Link>
                ) : (
                  <Button type="link" onClick={item.onClick}>
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </Button>
                )}
              </NavMenuItem>
            ))}
          </NavMenu>
        )}
      </div>

      {/* Content section */}
      <main>{children}</main>
    </div>
  )
}

export default PageLayout
