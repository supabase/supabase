'use client'

import { resolveBreadcrumbs, type BreadcrumbItem } from '~/lib/breadcrumbs'
import { Check, ChevronDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Ref } from 'react'
import MenuIconPicker from './MenuIconPicker'
import { cn, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

interface HeaderBreadcrumbsProps {
  headingSlotRef?: Ref<HTMLLIElement>
  className?: string
}

interface BreadcrumbCrumbProps {
  crumb: BreadcrumbItem
  isCurrent: boolean
}

interface HiddenCrumbsMenuProps {
  crumbs: BreadcrumbItem[]
}

interface HiddenCrumbProps {
  crumb: BreadcrumbItem
}

interface SiblingPagesMenuProps {
  crumb: BreadcrumbItem
  pages: BreadcrumbItem[]
}

interface CrumbLabelProps {
  crumb: BreadcrumbItem
}

const getCrumbLabel = (crumb: BreadcrumbItem) => crumb.title || crumb.name

const getPages = (crumb: BreadcrumbItem | undefined) =>
  (crumb?.items ?? []).filter((item) => item.url && item.enabled !== false)

export const HeaderBreadcrumbs = ({ headingSlotRef, className }: HeaderBreadcrumbsProps) => {
  const pathname = usePathname() ?? ''
  const breadcrumbs = resolveBreadcrumbs(pathname)

  const pageCrumbs = breadcrumbs.filter((crumb) => crumb.url)

  if (pageCrumbs.length === 0) return null

  const [firstCrumb, ...restCrumbs] = pageCrumbs
  const lastCrumb = restCrumbs.at(-1)
  const hiddenCrumbs = restCrumbs.slice(0, -1)
  const currentPages = getPages(breadcrumbs.at(-2))

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-2 text-sm font-medium leading-4.5">
        <BreadcrumbCrumb crumb={firstCrumb} isCurrent={!lastCrumb} />
        {hiddenCrumbs.length > 0 ? (
          <>
            <BreadcrumbSquare />
            <HiddenCrumbsMenu crumbs={hiddenCrumbs} />
          </>
        ) : null}
        {lastCrumb ? (
          <>
            <BreadcrumbSquare />
            {currentPages.length > 1 ? (
              <SiblingPagesMenu crumb={lastCrumb} pages={currentPages} />
            ) : (
              <BreadcrumbCrumb crumb={lastCrumb} isCurrent />
            )}
          </>
        ) : null}
        <li ref={headingSlotRef} className="flex min-w-0 items-center gap-2 empty:hidden" />
      </ol>
    </nav>
  )
}

const BreadcrumbCrumb = ({ crumb, isCurrent }: BreadcrumbCrumbProps) => (
  <li
    className={cn(
      'flex min-w-0 items-center',
      isCurrent ? 'shrink-0 text-foreground' : 'text-foreground-lighter'
    )}
  >
    {crumb.url && !isCurrent ? (
      <Link
        href={crumb.url}
        className="flex min-w-0 items-center gap-2 transition-colors hover:text-foreground"
      >
        <CrumbLabel crumb={crumb} />
      </Link>
    ) : (
      <span className="flex min-w-0 items-center gap-2">
        <CrumbLabel crumb={crumb} />
      </span>
    )}
  </li>
)

const HiddenCrumbsMenu = ({ crumbs }: HiddenCrumbsMenuProps) => (
  <li className="flex shrink-0">
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Show hidden breadcrumbs"
        className="flex h-5 items-center rounded-sm px-0.5 text-foreground-lighter transition-colors hover:text-foreground data-[state=open]:text-foreground focus-ring"
      >
        <MoreHorizontal size={14} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {crumbs.map((crumb) => (
          <HiddenCrumb key={crumb.url ?? getCrumbLabel(crumb)} crumb={crumb} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </li>
)

const HiddenCrumb = ({ crumb }: HiddenCrumbProps) => (
  <DropdownMenuItem asChild>
    <Link href={crumb.url ?? '/'}>{getCrumbLabel(crumb)}</Link>
  </DropdownMenuItem>
)

const SiblingPagesMenu = ({ crumb, pages }: SiblingPagesMenuProps) => (
  <li className="flex min-w-0 shrink-0">
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex min-w-0 items-center gap-1 rounded-sm text-foreground focus-ring">
        <span className="flex min-w-0 items-center gap-2">
          <CrumbLabel crumb={crumb} />
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className="shrink-0 text-foreground-muted transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        {pages.map((page) => (
          <DropdownMenuItem key={page.url} asChild className="justify-between gap-4">
            <Link href={page.url ?? '/'} aria-current={page.url === crumb.url ? 'page' : undefined}>
              <span className="flex min-w-0 items-center gap-2">
                <CrumbLabel crumb={page} />
              </span>
              {page.url === crumb.url ? <Check size={14} aria-hidden /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </li>
)

const CrumbLabel = ({ crumb }: CrumbLabelProps) => (
  <>
    {crumb.icon ? (
      <MenuIconPicker icon={crumb.icon} className="shrink-0 text-foreground-muted" />
    ) : null}
    <span className="truncate">{getCrumbLabel(crumb)}</span>
  </>
)

const BreadcrumbSquare = () => <li aria-hidden className="size-1 shrink-0 bg-foreground-muted" />
