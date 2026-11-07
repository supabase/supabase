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
        <BreadcrumbList className="flex-nowrap text-sm sm:gap-x-1">
          {parent && (
            <>
              <BreadcrumbItem className="min-w-0 leading-none">
                <BreadcrumbLink
                  role="button"
                  tabIndex={0}
                  onClick={parent.onClick}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      parent.onClick()
                    }
                  }}
                  title={parent.label}
                  className="min-w-0 cursor-pointer truncate no-underline focus-ring"
                >
                  {parent.label}
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
