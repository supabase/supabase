'use client'

import * as Collapsible from '@radix-ui/react-collapsible'

import { debounce } from 'lodash-es'
import { ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { HTMLAttributes, MouseEvent, PropsWithChildren } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { cn } from 'ui'

import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { isElementInViewport } from '~/features/ui/helpers.dom'
import { BASE_PATH } from '~/lib/constants'

export const ReferenceContentInitiallyScrolledContext = createContext<boolean>(false)

let patchCount = 0
let originalPushState: typeof history.pushState | null = null
let originalReplaceState: typeof history.replaceState | null = null
const pathnameListeners = new Set<() => void>()

function notifyPathnameListeners() {
  pathnameListeners.forEach((callback) => callback())
}

function subscribeToPathname(callback: () => void) {
  pathnameListeners.add(callback)

  if (patchCount === 0) {
    window.addEventListener('popstate', notifyPathnameListeners)

    originalPushState = history.pushState.bind(history)
    history.pushState = (...args) => {
      originalPushState!(...args)
      notifyPathnameListeners()
    }

    originalReplaceState = history.replaceState.bind(history)
    history.replaceState = (...args) => {
      originalReplaceState!(...args)
      notifyPathnameListeners()
    }
  }
  patchCount++

  return () => {
    pathnameListeners.delete(callback)
    patchCount--

    if (patchCount === 0) {
      window.removeEventListener('popstate', notifyPathnameListeners)
      history.pushState = originalPushState!
      history.replaceState = originalReplaceState!
      originalPushState = null
      originalReplaceState = null
    }
  }
}

function getPathname() {
  if (typeof window === 'undefined') return ''
  const pathname = window.location.pathname
  return pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) : pathname
}

function getServerPathname() {
  return ''
}

function useCurrentPathname() {
  return useSyncExternalStore(subscribeToPathname, getPathname, getServerPathname)
}

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
  const [initiallyScrolled, setInitiallyScrolled] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    if (!initiallyScrolled) {
      const initialSelectedSection = pathname.replace(
        `/reference/${libPath}/${isLatestVersion ? '' : `${version}/`}`,
        ''
      )
      if (initialSelectedSection) {
        const section = document.getElementById(initialSelectedSection)
        if (section) {
          window.scrollTo(0, section.offsetTop - 60 /* space for header + padding */)
          section.querySelector('h2')?.focus()
        }
      }

      setInitiallyScrolled(true)
    }
  }, [pathname, libPath, version, isLatestVersion, initiallyScrolled])

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
  const parentRef = useRef<HTMLElement>()
  const ref = useRef<HTMLDivElement>(null)
  const initialScrollHappened = useContext(ReferenceContentInitiallyScrolledContext)

  useEffect(() => {
    if (!ref.current) return

    let scrollingParent: HTMLElement = ref.current

    while (scrollingParent && !(scrollingParent.scrollHeight > scrollingParent.clientHeight)) {
      const parent = scrollingParent.parentElement
      if (!parent) break
      scrollingParent = parent
    }

    parentRef.current = scrollingParent
  }, [])

  const scrollActiveIntoView = useCallback(() => {
    const currentLink = ref.current?.querySelector('[aria-current=page]') as HTMLElement
    if (currentLink && !isElementInViewport(currentLink)) {
      // Calculate the offset of the current link relative to scrollingParent
      // and scroll the parent to the top of the link.
      const offsetTop = currentLink.offsetTop
      const parentOffsetTop = parentRef.current?.offsetTop ?? 0
      const scrollPosition = offsetTop - parentOffsetTop

      parentRef.current?.scrollTo({
        top: scrollPosition - 60 /* space for header + padding */,
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

      const domElement = document.getElementById(sectionSlug)
      domElement?.scrollIntoView()
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
  const onClick = useCallback(
    (evt: MouseEvent) => createReferenceSubsectionNavigator(href, sectionSlug)(evt),
    [href, sectionSlug]
  )

  return (
    <Link href={href} onClick={onClick}>
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
  const ref = useRef<HTMLAnchorElement>(null)

  const pathname = useCurrentPathname()
  const href = deriveHref(basePath, section)
  const isActive =
    pathname === href || (pathname === basePath && href.replace(basePath, '') === '/introduction')

  useEffect(() => {
    if (ref.current) {
      ref.current.ariaCurrent = isActive ? 'page' : null
      ref.current.className = getLinkStyles(isActive, className)
    }
  }, [isActive, className])

  const onClick = useCallback(
    (evt: MouseEvent) => createReferenceSubsectionNavigator(href, section.slug)(evt),
    [href, section.slug]
  )

  if (!('title' in section)) return null

  const isCompoundSection =
    !skipChildren && 'items' in section && section.items && section.items.length > 0

  return (
    <>
      {isCompoundSection ? (
        <CompoundRefLink basePath={basePath} section={section} />
      ) : (
        <Link
          ref={ref}
          // We don't use these links because we never do real navigation, so
          // prefetching just wastes egress
          prefetch={false}
          href={href}
          className={getLinkStyles(isActive, className)}
          onClick={onClick}
        >
          {section.title}
        </Link>
      )}
    </>
  )
}

function useCompoundRefLinkActive(basePath: string, section: AbbrevApiReferenceSection) {
  const [open, _setOpen] = useState(false)

  const pathname = useCurrentPathname()
  const parentHref = deriveHref(basePath, section)
  const isParentActive = pathname === parentHref

  const childHrefs = useMemo(
    () => new Set((section.items || []).map((item) => deriveHref(basePath, item))),
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
          {(section.items || []).map((item, idx) => {
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
