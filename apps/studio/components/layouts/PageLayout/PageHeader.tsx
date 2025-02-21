import { Fragment, ReactNode } from 'react'

import { useParams } from 'common'
import { cn } from 'ui'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage as BreadcrumbPageItem,
  BreadcrumbSeparator,
} from 'ui/src/components/shadcn/ui/breadcrumb'
import { ScaffoldDescription, ScaffoldTitle } from '../Scaffold'

interface PageHeaderProps {
  title?: string
  subtitle?: string
  icon?: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  primaryActions?: ReactNode
  secondaryActions?: ReactNode
  className?: string
  isCompact?: boolean
}

export const PageHeader = ({
  title,
  subtitle,
  icon,
  breadcrumbs = [],
  primaryActions,
  secondaryActions,
  className,
  isCompact = false,
}: PageHeaderProps) => {
  const { ref } = useParams()

  const displayBreadcrumbs = isCompact && title ? [...breadcrumbs, { label: title }] : breadcrumbs

  return (
    <div className={cn('space-y-4', className)}>
      {(displayBreadcrumbs.length > 0 ||
        (isCompact && (title || primaryActions || secondaryActions))) && (
        <div className={cn('flex items-center gap-4', isCompact ? 'justify-between' : 'mb-4')}>
          {displayBreadcrumbs.length > 0 ? (
            <Breadcrumb className={cn('text-foreground-muted', isCompact && 'text-base')}>
              <BreadcrumbList className={isCompact ? 'text-base' : 'text-xs'}>
                {displayBreadcrumbs.map((item, index) => (
                  <Fragment key={item.label}>
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink href={!!ref ? item.href.replace('[ref]', ref) : item.href}>
                          {item.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPageItem>{item.label}</BreadcrumbPageItem>
                      )}
                    </BreadcrumbItem>
                    {index < displayBreadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </Fragment>
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
                {title && <ScaffoldTitle>{title}</ScaffoldTitle>}
                {subtitle && (
                  <ScaffoldDescription className="text-sm text-foreground-light">
                    {subtitle}
                  </ScaffoldDescription>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {secondaryActions && <div className="flex items-center gap-2">{secondaryActions}</div>}
            {primaryActions && <div className="flex items-center gap-2">{primaryActions}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
