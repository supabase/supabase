'use client'

import { secondaryLinks } from '~/data/footer'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import Link from 'next/link'
import { useRef, type FocusEvent, type PointerEvent, type ReactNode } from 'react'
import { cn, IconDiscord, IconGitHubSolid, IconTwitterX, IconYoutubeSolid } from 'ui'

import { IssueIcon, NewsIcon } from './FooterIcons'

interface FooterProps {
  className?: string
}

interface FooterCell {
  label: string
  href: string
  indicator: ReactNode
}

interface HatchCenter {
  hatch: HTMLElement
  x: number
  y: number
}

const FOOTER_CELLS: FooterCell[] = [
  {
    label: 'System status',
    href: 'https://status.supabase.com',
    indicator: <span className="size-2 rounded-xs bg-current" />,
  },
  { label: 'Product updates', href: 'https://supabase.com/changelog', indicator: <NewsIcon /> },
  {
    label: 'Report issue',
    href: 'https://github.com/supabase/supabase/issues',
    indicator: <IssueIcon />,
  },
]

const setHatchCenter = ({ hatch, x, y }: HatchCenter) => {
  hatch.style.setProperty('--footer-hatch-x', `${x}px`)
  hatch.style.setProperty('--footer-hatch-y', `${y}px`)
}

const Footer = ({ className }: FooterProps) => {
  const hatchRef = useRef<HTMLSpanElement>(null)

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!hatchRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    setHatchCenter({
      hatch: hatchRef.current,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })
  }

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (!hatchRef.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const target = event.target.getBoundingClientRect()
    setHatchCenter({
      hatch: hatchRef.current,
      x: target.left + target.width / 2 - bounds.left,
      y: target.top + target.height / 2 - bounds.top,
    })
  }

  return (
    <footer role="contentinfo" aria-label="footer" className={cn('mt-16', className)}>
      <div
        onPointerEnter={handlePointerMove}
        onPointerMove={handlePointerMove}
        onFocus={handleFocus}
        className="footer-cells relative"
      >
        <span ref={hatchRef} aria-hidden className="footer-hatch" />
        <ul className="relative grid grid-cols-1 divide-y divide-dashed border-y border-dashed sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {FOOTER_CELLS.map((cell, index) => (
            <li key={cell.label} className="flex min-w-0">
              <a
                href={cell.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex min-h-16 w-full items-center justify-center px-4 py-6 focus-ring sm:p-8"
              >
                <span className="flex items-center gap-2">
                  <span className="footer-cell-icon flex size-3.75 shrink-0 items-center justify-center text-foreground-lighter transition-colors duration-150 group-hover:text-brand group-focus-visible:text-brand">
                    {cell.indicator}
                  </span>
                  <span className="footer-cell-label text-xs font-medium text-foreground-light transition-colors duration-150 group-hover:text-foreground">
                    {cell.label}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <LayoutMainContent className="mx-0 max-w-none pt-6">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex flex-col lg:flex-row gap-3 ">
            <Link href="https://supabase.com/" className="text-xs text-foreground-lighter">
              &copy; Supabase Inc
            </Link>
            <span className="text-xs text-foreground-lighter">—</span>
            {secondaryLinks.map(({ component: Component, ...item }) =>
              item.url ? (
                <Link
                  href={item.url}
                  key={item.url}
                  className="text-xs text-foreground-lighter hover:underline"
                >
                  {item.title}
                </Link>
              ) : (
                Component && (
                  <Component
                    key={item.title}
                    className="text-xs text-foreground-lighter hover:underline"
                  >
                    {item.title}
                  </Component>
                )
              )
            )}
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/supabase"
              className="text-foreground-muted hover:text-foreground transition"
            >
              <span className="sr-only">Twitter</span>
              <IconTwitterX size={14} />
            </a>

            <a
              href="https://github.com/supabase"
              className="text-foreground-muted hover:text-foreground transition"
            >
              <span className="sr-only">GitHub</span>
              <IconGitHubSolid size={14} />
            </a>

            <a
              href="https://discord.supabase.com/"
              className="text-foreground-muted hover:text-foreground transition"
            >
              <span className="sr-only">Discord</span>
              <IconDiscord size={14} />
            </a>

            <a
              href="https://youtube.com/c/supabase"
              className="text-foreground-muted hover:text-foreground transition"
            >
              <span className="sr-only">Youtube</span>
              <IconYoutubeSolid size={14} />
            </a>
          </div>
        </div>
      </LayoutMainContent>
    </footer>
  )
}

export default Footer
