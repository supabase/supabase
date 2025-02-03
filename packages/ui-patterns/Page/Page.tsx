import React from 'react'
import { Button, cn, NavMenu, NavMenuItem } from 'ui'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage as BreadcrumbPageItem,
  BreadcrumbSeparator,
} from 'ui/src/components/shadcn/ui/breadcrumb'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface PageProps {
  children?: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  primaryActions?: React.ReactNode
  secondaryActions?: React.ReactNode
  navigation?: {
    items: {
      id: string
      label: string
      href?: string
      onClick?: () => void
      icon?: React.ReactNode
    }[]
  }
  size?: 'default' | 'small' | 'medium' | 'large' | 'full'
  className?: string
  isCompact?: boolean
}

const sizeClasses = {
  small: 'max-w-3xl px-8',
  medium: 'max-w-5xl px-8',
  large: 'max-w-7xl px-8',
  default: 'max-w-5xl px-8',
  full: 'w-full',
}

export function Page({
  children,
  title,
  subtitle,
  icon,
  breadcrumbs,
  primaryActions,
  secondaryActions,
  navigation,
  size = 'default',
  className,
  isCompact = false,
}: PageProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          'w-full mx-auto',
          sizeClasses[size],
          size === 'full' && (isCompact ? 'px-6 border-b' : 'px-8 border-b'),
          isCompact ? 'pt-4' : 'pt-16',
          !navigation && size === 'full' && (isCompact ? 'pb-4' : 'pb-8'),
          className
        )}
      >
        {/* Header section */}
        {(breadcrumbs || (isCompact && (title || primaryActions || secondaryActions))) && (
          <div className={cn('flex items-center gap-4', isCompact ? 'justify-between' : 'mb-4')}>
            {breadcrumbs ? (
              <Breadcrumb className={cn('text-foreground-muted', isCompact && 'text-base')}>
                <BreadcrumbList className={isCompact ? 'text-base' : 'text-xs'}>
                  {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item.label}>
                      <BreadcrumbItem>
                        {item.href ? (
                          <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                        ) : (
                          <BreadcrumbPageItem>{item.label}</BreadcrumbPageItem>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            ) : isCompact ? (
              title
            ) : null}
            {isCompact && (
              <div className="flex items-center gap-2">
                {secondaryActions && (
                  <div className="flex items-center gap-2">{secondaryActions}</div>
                )}
                {primaryActions && <div className="flex items-center gap-2">{primaryActions}</div>}
              </div>
            )}
          </div>
        )}

        {!isCompact && (
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {icon && <div className="text-foreground-light">{icon}</div>}
                <div className="space-y-1">
                  {title && <h1 className="text-2xl text-foreground">{title}</h1>}
                  {subtitle && <p className="text-sm text-foreground-light">{subtitle}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {secondaryActions && (
                <div className="flex items-center gap-2">{secondaryActions}</div>
              )}
              {primaryActions && <div className="flex items-center gap-2">{primaryActions}</div>}
            </div>
          </div>
        )}

        {/* Navigation section */}
        {navigation && (
          <NavMenu className={cn('mt-4', size === 'full' && 'border-none')}>
            {navigation.items.map((item) => (
              <NavMenuItem key={item.id} active={false}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={item.onClick}
                    className="inline-flex items-center gap-2"
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
      {children}
    </div>
  )
}

export type { PageProps }
