import type { ReactNode } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
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
                <Button
                  variant="text"
                  className="h-auto min-w-0 p-0 text-sm text-foreground-lighter hover:text-foreground [&>span]:truncate"
                  onClick={parent.onClick}
                  title={parent.label}
                >
                  {parent.label}
                </Button>
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
