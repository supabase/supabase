import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
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
    label?: string
    href?: string
    element?: ReactNode
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
          <div className="flex items-center gap-4">
            {breadcrumbs.length > 0 ? (
              <Breadcrumb className={cn('text-foreground-muted', isCompact && 'text-base')}>
                <BreadcrumbList className={isCompact ? 'text-base' : 'text-xs'}>
                  {breadcrumbs.map((item, index) => (
                    <Fragment key={item.label || `breadcrumb-${index}`}>
                      <BreadcrumbItem>
                        {item.element ? (
                          item.element
                        ) : item.href ? (
                          <BreadcrumbLink asChild className="flex items-center gap-2">
                            <Link href={!!ref ? item.href.replace('[ref]', ref) : item.href}>
                              {breadcrumbs.length === 1 && !isCompact && (
                                <ChevronLeft size={16} strokeWidth={1.5} />
                              )}
                              {item.label}
                            </Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPageItem className="flex items-center gap-2">
                            {breadcrumbs.length === 1 && (
                              <ChevronLeft size={16} strokeWidth={1.5} />
                            )}
                            {item.label}
                          </BreadcrumbPageItem>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </Fragment>
                  ))}
                  {isCompact && title && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPageItem>{title}</BreadcrumbPageItem>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            ) : isCompact ? (
              title
            ) : null}
          </div>
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
