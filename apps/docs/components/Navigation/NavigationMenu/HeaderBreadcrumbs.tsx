'use client'

import RefVersionDropdown from '~/components/RefVersionDropdown'
import { resolveBreadcrumbs, type BreadcrumbItem } from '~/lib/breadcrumbs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, type Ref } from 'react'
import { cn } from 'ui'

import MenuIconPicker from './MenuIconPicker'

interface HeaderBreadcrumbsProps {
  headingSlotRef?: Ref<HTMLLIElement>
  className?: string
}

interface BreadcrumbCrumbProps {
  crumb: BreadcrumbItem
  isCurrent: boolean
  hasIcon: boolean
}

const getCrumbLabel = (crumb: BreadcrumbItem) => crumb.title || crumb.name

export const HeaderBreadcrumbs = ({ headingSlotRef, className }: HeaderBreadcrumbsProps) => {
  const pathname = usePathname() ?? ''
  const crumbs = resolveBreadcrumbs(pathname)

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0 flex-1', className)}>
      <ol className="flex items-center gap-2 overflow-hidden whitespace-nowrap no-scrollbar mask-fadeout-right text-sm font-medium leading-4.5 hover:overflow-x-auto">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.url}-${getCrumbLabel(crumb)}`}>
            {index > 0 ? <BreadcrumbSquare /> : null}
            <BreadcrumbCrumb crumb={crumb} isCurrent={crumb.url === pathname} hasIcon={index > 0} />
            {crumb.version ? (
              <li className="flex shrink-0 items-center">
                <RefVersionDropdown
                  library={crumb.version.library}
                  currentVersion={crumb.version.current}
                />
              </li>
            ) : null}
          </Fragment>
        ))}
        <li ref={headingSlotRef} className="flex shrink-0 items-center gap-2 empty:hidden" />
      </ol>
    </nav>
  )
}

const BreadcrumbCrumb = ({ crumb, isCurrent, hasIcon }: BreadcrumbCrumbProps) => {
  const label = (
    <>
      {hasIcon && crumb.icon ? (
        <span aria-hidden className="contents">
          <MenuIconPicker icon={crumb.icon} className="shrink-0 text-foreground-muted" />
        </span>
      ) : null}
      {getCrumbLabel(crumb)}
    </>
  )

  return (
    <li
      className={cn(
        'flex shrink-0 items-center',
        isCurrent ? 'text-foreground' : 'text-foreground-lighter'
      )}
    >
      {crumb.url && !isCurrent ? (
        <Link
          href={crumb.url}
          className="flex items-center gap-2 transition-colors hover:text-foreground"
        >
          {label}
        </Link>
      ) : (
        <span className="flex items-center gap-2">{label}</span>
      )}
    </li>
  )
}

const BreadcrumbSquare = () => <li aria-hidden className="size-1 shrink-0 bg-foreground-muted" />
