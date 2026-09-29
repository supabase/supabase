import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { getMoveBreadcrumbs, type MoveBreadcrumb } from './MoveItemsModal.utils'

const CRUMB_CLASS = 'max-w-20 truncate text-xs md:max-w-none'

interface MoveItemsFolderPickerBreadcrumbProps {
  bucketName: string
  pathSegments: string[]
  onNavigate: (pathSegments: string[]) => void
}

const Crumb = ({
  crumb,
  onNavigate,
}: {
  crumb: MoveBreadcrumb
  onNavigate: (pathSegments: string[]) => void
}) => (
  <BreadcrumbItem className="min-w-0">
    {crumb.isCurrent ? (
      <BreadcrumbPage className={CRUMB_CLASS}>{crumb.label}</BreadcrumbPage>
    ) : (
      <BreadcrumbLink asChild className={CRUMB_CLASS}>
        <button type="button" tabIndex={0} onClick={() => onNavigate(crumb.pathSegments)}>
          {crumb.label}
        </button>
      </BreadcrumbLink>
    )}
  </BreadcrumbItem>
)

/**
 * Path to the folder being browsed. Follows the design system's responsive breadcrumb: the
 * bucket and the deepest folders stay visible, and the folders between them collapse into a
 * dropdown so a deeply nested path stays readable.
 */
export const MoveItemsFolderPickerBreadcrumb = ({
  bucketName,
  pathSegments,
  onNavigate,
}: MoveItemsFolderPickerBreadcrumbProps) => {
  const { first, collapsed, tail } = getMoveBreadcrumbs(bucketName, pathSegments)

  return (
    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
      <BreadcrumbList className="flex-nowrap gap-1 sm:gap-1">
        <Crumb crumb={first} onNavigate={onNavigate} />

        {collapsed.length > 0 && (
          <>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-1"
                  aria-label="Show the folders in between"
                >
                  <BreadcrumbEllipsis className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {collapsed.map((crumb) => (
                    <DropdownMenuItem
                      key={crumb.pathSegments.join('/')}
                      onSelect={() => onNavigate(crumb.pathSegments)}
                    >
                      {crumb.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}

        {tail.map((crumb) => (
          <Fragment key={crumb.pathSegments.join('/')}>
            <BreadcrumbSeparator className="shrink-0" />
            <Crumb crumb={crumb} onNavigate={onNavigate} />
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
