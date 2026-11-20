'use client'

import { AiTools } from '~/components/AiTools'
import { useTocAnchors } from '~/features/docs/GuidesMdx.state'
import { menuState } from '~/hooks/useMenuState'
import { ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from 'ui'
import { TocPrimitive, TocSection } from 'ui-patterns/Toc'

export interface CliNavLink {
  href: string
  label: string
  title: string
  /** Number of ancestor commands listed in the same group. */
  depth?: number
}

export interface CliNavGroup {
  id: string
  title: string
  items: CliNavLink[]
}

const closeMobileMenu = () => menuState.setMenuMobileOpen(false)

function scrollingParent(element: HTMLElement) {
  let parent = element.parentElement
  while (
    parent &&
    !(
      parent.scrollHeight > parent.clientHeight &&
      /auto|scroll/.test(getComputedStyle(parent).overflowY)
    )
  ) {
    parent = parent.parentElement
  }
  return parent
}

export function CliNavigationLinks({
  links,
  groups,
  activeHref,
}: {
  links: CliNavLink[]
  groups: CliNavGroup[]
  activeHref: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const activeGroup = groups.find((group) => group.items.some((item) => item.href === activeHref))
  const [open, setOpen] = useState(() => new Set(activeGroup ? [activeGroup.id] : []))

  useEffect(() => {
    if (activeGroup && !open.has(activeGroup.id)) {
      setOpen((current) => new Set(current).add(activeGroup.id))
    }
    // Only react to navigation, not to the user collapsing the active group.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id])

  // Scroll the sidebar only when the active item is outside its visible area.
  useLayoutEffect(() => {
    const active = ref.current?.querySelector<HTMLElement>('[aria-current=page]')
    if (!active) return
    const parent = scrollingParent(active)
    if (!parent) return
    const item = active.getBoundingClientRect()
    const box = parent.getBoundingClientRect()
    const visibleTop = Math.max(box.top, 0)
    const visibleBottom = Math.min(box.bottom, window.innerHeight)
    if (item.top < visibleTop || item.bottom > visibleBottom) {
      parent.scrollTop += item.top - box.top - parent.clientHeight / 2
    }
  }, [activeHref])

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div ref={ref} data-cli-nav className="flex flex-col gap-0.5 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={closeMobileMenu}
          aria-current={link.href === activeHref ? 'page' : undefined}
          className="cli-nav-link"
        >
          {link.label}
        </Link>
      ))}
      <hr className="w-full h-px my-3 bg-control border-0" />
      {groups.map((group) => {
        const isOpen = open.has(group.id)
        const panelId = `cli-nav-${group.id}`
        return (
          <div key={group.id}>
            <button
              type="button"
              tabIndex={0}
              className="cli-nav-group-toggle"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(group.id)}
            >
              {group.title}
              <ChevronRight aria-hidden size={14} strokeWidth={1.5} />
            </button>
            <div
              id={panelId}
              className="cli-nav-items"
              data-open={isOpen || undefined}
              inert={!isOpen}
            >
              <div>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    onClick={closeMobileMenu}
                    aria-current={item.href === activeHref ? 'page' : undefined}
                    className="cli-nav-item"
                    data-depth={item.depth || undefined}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ACTIVE_HEADING_OFFSET = 140

/**
 * The guides' observer marks every heading in a band as active, so a parent
 * and its children light up together. Here exactly one heading is active: the
 * last one above the offset from the top of the viewport.
 */
function SingleActiveAnchor({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [active, setActive] = useState<string[]>([])
  const key = ids.join('\n')

  useEffect(() => {
    const headings = key ? key.split('\n') : []
    const update = () => {
      let current = headings[0]
      for (const id of headings) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= ACTIVE_HEADING_OFFSET) current = id
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6
      if (atBottom && window.scrollY > 0) current = headings.at(-1) ?? current
      setActive((previous) => (previous[0] === current ? previous : current ? [current] : []))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [key])

  return (
    <TocPrimitive.ActiveAnchorContext value={active}>{children}</TocPrimitive.ActiveAnchorContext>
  )
}

/** Right column: table of contents, then the page's Markdown and AI actions. */
export function CliPageAside({
  markdownHref,
  publicMarkdownUrl,
  className,
}: {
  markdownHref: string
  publicMarkdownUrl: string
  className?: string
}) {
  const { toc } = useTocAnchors()

  return (
    <div className={cn('thin-scrollbar overflow-y-auto h-fit px-px', className)}>
      <div className="w-full relative border-l flex flex-col gap-6 lg:gap-8 px-2 h-fit">
        {/* The column is already sticky; a sticky TOC inside it would overlap the actions below */}
        {toc.length !== 0 && (
          <SingleActiveAnchor ids={toc.map((item) => item.url.slice(1))}>
            <TocSection items={toc} className="relative top-0" />
          </SingleActiveAnchor>
        )}
        <div className="pl-5 flex flex-col gap-2">
          <AiTools
            pageType="reference"
            articleId="sb-docs-guide-main-article"
            pageUrl={publicMarkdownUrl}
            markdownUrl={markdownHref}
          />
          <a
            href={markdownHref}
            className="flex items-center gap-1.5 text-xs text-foreground-lighter transition-colors hover:text-foreground"
          >
            <FileText aria-hidden className="size-3.5" strokeWidth={1.5} />
            View as Markdown
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * Fades in content as it scrolls into view. Only content that starts below the
 * fold is hidden, and only once JavaScript runs, so the first paint is never
 * blank.
 */
export function CliReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('#sb-docs-guide-main-article [data-cli-reveal]')
    ).filter((element) => element.getBoundingClientRect().top > window.innerHeight)

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('cli-revealed')
          observer.unobserve(entry.target)
        }),
      { rootMargin: '0px 0px -40px 0px' }
    )
    elements.forEach((element) => {
      element.classList.add('cli-reveal-pending')
      observer.observe(element)
    })
    return () => {
      observer.disconnect()
      elements.forEach((element) => element.classList.remove('cli-reveal-pending', 'cli-revealed'))
    }
  }, [pathname])

  return null
}
