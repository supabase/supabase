'use client'

import {
  NavSectionCaret,
  NavSectionContent,
  NavSectionList,
} from '~/components/Navigation/NavSection'
import { useDocsLayoutV2 } from '~/features/DocsLayout/useDocsLayoutV2'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { isElementInViewport } from '~/features/ui/helpers.dom'
import { HeadingSlotCrumb } from '~/layouts/HeadingSlot'
import { BASE_PATH } from '~/lib/constants'
import { debounce } from 'lodash-es'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Collapsible } from 'radix-ui'
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

export interface ReferenceCrumbHeading {
  url: string
  title: string
}

interface ReferenceActiveCrumbProps {
  basePath: string
  headings: ReferenceCrumbHeading[]
}

export const ACTIVE_BAR_CLASS_NAME = 'layout-v2:docs-active-bar'

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
  const hasFocusedSection = useRef(false)
  const isLayoutV2 = useDocsLayoutV2()

  const pathname = usePathname()
  // the url follows the section on screen, so the deep link target comes from the first render
  const [initialSelectedSection] = useState(() =>
    pathname.replace(`/reference/${libPath}/${isLatestVersion ? '' : `${version}/`}`, '')
  )

  // the layout flag can load after the first scroll. the new columns reflow the page, so it scrolls again
  useEffect(() => {
    const section = initialSelectedSection ? document.getElementById(initialSelectedSection) : null
    if (section) {
      window.scrollTo(0, section.offsetTop - 60 /* space for header + padding */)
      if (!hasFocusedSection.current) section.querySelector('h2')?.focus()
    }
    hasFocusedSection.current = true
    setInitiallyScrolled(true)
  }, [initialSelectedSection, isLayoutV2])

  return (
    <ReferenceContentInitiallyScrolledContext.Provider value={initiallyScrolled}>
      {children}
    </ReferenceContentInitiallyScrolledContext.Provider>
  )
}

export function ReferenceNavigationScrollHandler({
  children,
  ...rest
}: PropsWithChildren & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement | null>(null)
  const initialScrollHappened = useContext(ReferenceContentInitiallyScrolledContext)

  const scrollActiveIntoView = useCallback(() => {
    if (!ref.current?.offsetParent) return

    const currentLink = ref.current.querySelector<HTMLElement>('[aria-current=page]')
    if (!currentLink || isElementInViewport(currentLink)) return

    let scrollingParent: HTMLElement = ref.current
    while (scrollingParent.scrollHeight <= scrollingParent.clientHeight) {
      if (!scrollingParent.parentElement) return
      scrollingParent = scrollingParent.parentElement
    }

    const linkOffset =
      currentLink.getBoundingClientRect().top - scrollingParent.getBoundingClientRect().top
    scrollingParent.scrollTo({
      top: scrollingParent.scrollTop + linkOffset - 60 /* space for header + padding */,
    })
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
    <nav ref={ref} {...rest}>
      {children}
    </nav>
  )
}

function deriveHref(basePath: string, section: AbbrevApiReferenceSection) {
  return 'slug' in section ? `${basePath}/${section.slug}` : ''
}

export function ReferenceActiveCrumb({ basePath, headings }: ReferenceActiveCrumbProps) {
  const pathname = useCurrentPathname()
  const activePath = pathname === basePath ? `${basePath}/introduction` : pathname
  const index = headings.findIndex((heading) => heading.url === activePath)

  return <HeadingSlotCrumb heading={headings[index]} index={index} />
}

function getLinkStyles(isActive: boolean, className?: string) {
  return cn(
    'text-sm text-foreground-lighter',
    !isActive && 'hover:text-foreground',
    isActive && 'text-primary',
    'transition-colors',
    'layout-v2:docs-rail-link',
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
  realNavigation,
}: {
  basePath: string
  section: AbbrevApiReferenceSection
  skipChildren?: boolean
  className?: string
  // Spike (DOCS-1268): when true, this link does a real navigation instead of
  // the scroll-hijack below — used only by the API reference, whose endpoints
  // are now real pages. Undefined everywhere else preserves current behavior.
  realNavigation?: boolean
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
    (evt: MouseEvent) => {
      if (realNavigation) return
      createReferenceSubsectionNavigator(href, section.slug)(evt)
    },
    [href, section.slug, realNavigation]
  )

  if (!('title' in section)) return null

  const isCompoundSection =
    !skipChildren && 'items' in section && section.items && section.items.length > 0

  return (
    <>
      {isCompoundSection ? (
        <CompoundRefLink basePath={basePath} section={section} realNavigation={realNavigation} />
      ) : (
        <Link
          ref={ref}
          // Scroll-hijack links never navigate, so disable prefetch. Real API
          // pages omit the prop and keep Next.js's default prefetch behavior.
          {...(!realNavigation ? { prefetch: false } : {})}
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
  realNavigation,
}: {
  basePath: string
  section: AbbrevApiReferenceSection
  realNavigation?: boolean
}) {
  const { open, setOpen, isActive } = useCompoundRefLinkActive(basePath, section)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild disabled={isActive}>
        <button
          tabIndex={0}
          className={cn(
            'group',
            'cursor-pointer',
            'w-full',
            'flex items-center justify-between gap-2'
          )}
        >
          <span className={getLinkStyles(false)}>{section.title}</span>
          <NavSectionCaret className="group-disabled:cursor-not-allowed group-disabled:opacity-10" />
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content asChild>
        <NavSectionContent>
          <NavSectionList>
            {(section.items || []).map((item, idx) => {
              return (
                <li key={`${section.id}-${idx}`}>
                  <RefLink
                    basePath={basePath}
                    section={item}
                    className={`block py-1.25 ${ACTIVE_BAR_CLASS_NAME}`}
                    realNavigation={realNavigation}
                  />
                </li>
              )
            })}
          </NavSectionList>
        </NavSectionContent>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
