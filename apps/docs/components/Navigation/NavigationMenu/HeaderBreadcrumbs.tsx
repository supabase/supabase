'use client'

import RefVersionDropdown from '~/components/RefVersionDropdown'
import { getCrumbName, resolveBreadcrumbs, type BreadcrumbItem as Crumb } from '~/lib/breadcrumbs'
import Link from 'next/link'
import { useDocsPathname } from '~/features/IaNav/IaNavRouteProvider'
import { useNavItems } from '~/features/IaNav/useNavItems'
import { Fragment, type Ref } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  cn,
} from 'ui'

import MenuIconPicker from './MenuIconPicker'

interface HeaderBreadcrumbsProps {
  headingSlotRef?: Ref<HTMLLIElement>
  className?: string
}

interface BreadcrumbCrumbProps {
  crumb: Crumb
  isCurrent: boolean
  hasIcon: boolean
}

export const HeaderBreadcrumbs = ({ headingSlotRef, className }: HeaderBreadcrumbsProps) => {
  const pathname = useDocsPathname()
  // a group with an overview page links to it, so on that page the group is the current crumb
  const linkedCrumbs = resolveBreadcrumbs(pathname, useNavItems()).reduce<Crumb[]>(
    (chain, crumb) => {
      const firstItem = crumb.items?.[0]
      const url =
        crumb.url ??
        (firstItem && getCrumbName(firstItem) === 'Overview' ? firstItem.url : undefined)
      if (url && url === chain.at(-1)?.url) return chain
      return [...chain, url === crumb.url ? crumb : { ...crumb, url }]
    },
    []
  )
  // the sidebar top row names the section, so the header keeps only the parent and the page
  const crumbs = (linkedCrumbs.length > 1 ? linkedCrumbs.slice(1) : linkedCrumbs).slice(-2)

  if (crumbs.length === 0) return null

  return (
    <Breadcrumb aria-label="Breadcrumb" className={cn('min-w-0 flex-1', className)}>
      <BreadcrumbList className="-m-1.5 flex-nowrap gap-2 overflow-hidden whitespace-nowrap no-scrollbar mask-fadeout-right p-1.5 font-medium leading-4.5 sm:gap-2 hover:overflow-x-auto focus-within:overflow-x-auto">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.url}-${getCrumbName(crumb)}`}>
            {index > 0 ? (
              <BreadcrumbSeparator className="flex shrink-0">
                <span className="size-1 bg-foreground-muted" />
              </BreadcrumbSeparator>
            ) : null}
            <BreadcrumbCrumb
              crumb={crumb}
              isCurrent={index === crumbs.length - 1 && crumb.url === pathname}
              hasIcon={crumb !== linkedCrumbs[0]}
            />
            {crumb.version ? (
              <BreadcrumbItem className="shrink-0">
                <RefVersionDropdown
                  library={crumb.version.library}
                  currentVersion={crumb.version.current}
                />
              </BreadcrumbItem>
            ) : null}
          </Fragment>
        ))}
        <li ref={headingSlotRef} className="flex shrink-0 items-center gap-2 empty:hidden" />
      </BreadcrumbList>
    </Breadcrumb>
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
      {getCrumbName(crumb)}
    </>
  )

  return (
    <BreadcrumbItem className="shrink-0 leading-4.5">
      {isCurrent ? (
        <BreadcrumbPage className="flex items-center gap-2">{label}</BreadcrumbPage>
      ) : crumb.url ? (
        <BreadcrumbLink
          asChild
          className="-m-1.5 flex items-center gap-2 rounded-md p-1.5 no-underline focus-inset"
        >
          <Link href={crumb.url}>{label}</Link>
        </BreadcrumbLink>
      ) : (
        <span className="flex items-center gap-2">{label}</span>
      )}
    </BreadcrumbItem>
  )
}
