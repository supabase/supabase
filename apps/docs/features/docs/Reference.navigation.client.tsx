'use client'

import * as Collapsible from '@radix-ui/react-collapsible'

import { debounce } from 'lodash'
import { ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { HTMLAttributes, MouseEvent, PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from 'ui'

import { BASE_PATH } from '~/lib/constants'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { isElementInViewport } from '~/features/ui/helpers.dom'

export const ReferenceContentInitiallyScrolledContext = createContext<boolean>(false)

export function ReferenceContentScrollHandler({
  libPath,
  version,
  isLatestVersion,
  children,
}: PropsWithChildren<{
  libPath: string
  version: string
  isLatestVersion: boolean
}>) {
  const checkedPathnameOnLoad = useRef(false)
  const [initiallyScrolled, setInitiallyScrolled] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    if (!checkedPathnameOnLoad.current) {
      const initialSelectedSection = pathname.replace(
        `/reference/${libPath}/${isLatestVersion ? '' : `${version}/`}`,
        ''
      )
      if (initialSelectedSection) {
        const section = document.getElementById(initialSelectedSection)
        section?.scrollIntoView()
        section?.querySelector('h2')?.focus()
      }

      checkedPathnameOnLoad.current = true
      setInitiallyScrolled(true)
    }
  }, [pathname, libPath, version, isLatestVersion])

  return (
    <ReferenceContentInitiallyScrolledContext.Provider value={initiallyScrolled}>
      {children}
    </ReferenceContentInitiallyScrolledContext.Provider>
  )
}

export function ReferenceNavigationScrollHandler({
  children,
  ...rest
}: PropsWithChildren & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>()
  const initialScrollHappened = useContext(ReferenceContentInitiallyScrolledContext)

  const scrollActiveIntoView = useCallback(() => {
    const currentLink = ref.current?.querySelector('[aria-current=page]') as HTMLElement
    if (currentLink && !isElementInViewport(currentLink)) {
      currentLink.scrollIntoView({
        block: 'center',
      })
    }
  }, [])

  useEffect(() => {
    if (initialScrollHappened) {
      scrollActiveIntoView()
    }
  }, [initialScrollHappened, scrollActiveIntoView])

  useEffect(() => {
    const debouncedScrollActiveIntoView = debounce(scrollActiveIntoView, 150)

    window.addEventListener('scrollend', debouncedScrollActiveIntoView)
    return () => window.removeEventListener('scrollend', debouncedScrollActiveIntoView)
  }, [scrollActiveIntoView])

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  )
}

function deriveHref(basePath: string, section: AbbrevApiReferenceSection) {
  return 'slug' in section ? `${basePath}/${section.slug}` : ''
}

function getLinkStyles(isActive: boolean, className?: string) {
  return cn(
    'text-sm text-foreground-lighter',
    !isActive && 'hover:text-foreground',
    isActive && 'text-brand',
    'transition-colors',
    className
  )
}

/**
 * Creates a function that navigates to a reference subsection.
 *
 * Since reference "pages" are actually an agglomeration of many "pages", we
 * don't want to actually complete a full page navigation.
 *
 * @param href - The path to the navigation target.
 * @param sectionSlug - The slug of the section to navigate to.
 * @returns A function that navigates to the reference subsection.
 */
function createReferenceSubsectionNavigator(href: string, sectionSlug?: string) {
  return function navigateToReferenceSubsection(evt: MouseEvent) {
    if (sectionSlug) {
      evt.preventDefault()
      history.pushState({}, '', `${BASE_PATH}${href}`)

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const domElement = document.getElementById(sectionSlug)
      domElement?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
      })
      domElement?.querySelector('h2')?.focus()
    }
  }
}

export function RefInternalLink({
  href,
  sectionSlug,
  children,
}: {
  href: string
  sectionSlug?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} onClick={createReferenceSubsectionNavigator(href, sectionSlug)}>
      {children}
    </Link>
  )
}

export function RefLink({
  basePath,
  section,
  skipChildren = false,
  className,
}: {
  basePath: string
  section: AbbrevApiReferenceSection
  skipChildren?: boolean
  className?: string
}) {
  const ref = useRef<HTMLAnchorElement>()

  const pathname = usePathname()
  const href = deriveHref(basePath, section)
  const isActive =
    pathname === href || (pathname === basePath && href.replace(basePath, '') === '/introduction')

  if (!('title' in section)) return null

  const isCompoundSection = !skipChildren && 'items' in section && section.items.length > 0

  return (
    <>
      {isCompoundSection ? (
        <CompoundRefLink basePath={basePath} section={section} />
      ) : (
        <Link
          ref={ref}
          href={href}
          aria-current={isActive ? 'page' : false}
          className={getLinkStyles(isActive, className)}
          onClick={createReferenceSubsectionNavigator(href, section.slug)}
        >
          {section.title}
        </Link>
      )}
    </>
  )
}

function useCompoundRefLinkActive(basePath: string, section: AbbrevApiReferenceSection) {
  const [open, _setOpen] = useState(false)

  const pathname = usePathname()
  const parentHref = deriveHref(basePath, section)
  const isParentActive = pathname === parentHref

  const childHrefs = useMemo(
    () => new Set(section.items.map((item) => deriveHref(basePath, item))),
    [basePath, section]
  )
  const isChildActive = childHrefs.has(pathname)

  const isActive = isParentActive || isChildActive

  const setOpen = (open: boolean) => {
    // Disable closing if the section is active, to prevent the currently active
    // link disappearing
    if (open || !isActive) _setOpen(open)
  }

  if (isActive && !open) {
    setOpen(true)
  }

  return { open, setOpen, isActive }
}

function CompoundRefLink({
  basePath,
  section,
}: {
  basePath: string
  section: AbbrevApiReferenceSection
}) {
  const { open, setOpen, isActive } = useCompoundRefLinkActive(basePath, section)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild disabled={isActive}>
        <button
          className={cn(
            'group',
            'cursor-pointer',
            'w-full',
            'flex items-center justify-between gap-2'
          )}
        >
          <span className={getLinkStyles(false)}>{section.title}</span>
          <ChevronUp
            width={16}
            className={cn(
              'group-disabled:cursor-not-allowed group-disabled:opacity-10',
              'data-open-parent:rotate-0 data-closed-parent:rotate-90',
              'transition'
            )}
          />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content
        className={cn('border-l border-control pl-3 ml-1 data-open:mt-2 grid gap-2.5')}
      >
        <ul className="space-y-2">
          <RefLink basePath={basePath} section={section} skipChildren />
          {section.items.map((item, idx) => {
            return (
              <li key={`${section.id}-${idx}`}>
                <RefLink basePath={basePath} section={item} />
              </li>
            )
          })}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
