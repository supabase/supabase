import type { ReactNode } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ui'

interface SidebarBreadcrumbProps {
  label: string
  'aria-label': string
  parent?: { label: string; onClick: () => void }
  action?: ReactNode
}

export const SidebarBreadcrumb = ({
  label,
  'aria-label': ariaLabel,
  parent,
  action,
}: SidebarBreadcrumbProps) => {
  return (
    <>
      <Breadcrumb aria-label={ariaLabel} className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap gap-1 text-sm sm:gap-1">
          {parent && (
            <>
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbLink asChild className="min-w-0 cursor-pointer truncate focus-ring">
                  <button type="button" tabIndex={0} onClick={parent.onClick} title={parent.label}>
                    {parent.label}
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate text-sm" title={label}>
              {label}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </>
  )
}
