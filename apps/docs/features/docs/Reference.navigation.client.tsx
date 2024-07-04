'use client'

import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useMemo, useState, type MouseEvent } from 'react'

import { cn } from 'ui'

import { BASE_PATH } from '~/lib/constants'
import type { AbbrevCommonClientLibSection } from './Reference.navigation'

function deriveHref(basePath: string, section: AbbrevCommonClientLibSection) {
  return 'slug' in section ? `${basePath}/${section.slug}` : ''
}

function RefLink({
  basePath,
  section,
  skipChildren = false,
  className,
  onClick,
}: {
  basePath: string
  section: AbbrevCommonClientLibSection
  skipChildren?: boolean
  className?: string
  onClick?: (evt: MouseEvent) => void
}) {
  const pathname = usePathname()

  if (!('title' in section)) return null

  const isCompoundSection = !skipChildren && 'items' in section && section.items.length > 0

  const href = deriveHref(basePath, section)
  const isActive = pathname === href

  return (
    <>
      {isCompoundSection ? (
        <CompoundRefLink basePath={basePath} section={section} />
      ) : (
        <Link
          href={href}
          className={cn(
            'text-sm text-foreground-lighter',
            !isActive && 'hover:text-foreground',
            isActive && 'text-brand',
            'transition-colors',
            className
          )}
          onClick={(evt: MouseEvent) => {
            /*
             * We don't actually want to navigate or rerender anything since
             * links are all to sections on the same page.
             */
            evt.preventDefault()
            history.pushState({}, '', `${BASE_PATH}${href}`)

            if ('slug' in section) {
              const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              document.getElementById(section.slug)?.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
              })
            }

            onClick?.(evt)
          }}
        >
          {section.title}
        </Link>
      )}
    </>
  )
}

function useCompoundRefLinkActive(basePath: string, section: AbbrevCommonClientLibSection) {
  const [open, setOpen] = useState(false)

  const pathname = usePathname()
  const parentHref = deriveHref(basePath, section)
  const isParentActive = pathname === parentHref

  const childHrefs = useMemo(
    () => new Set(section.items.map((item) => deriveHref(basePath, item))),
    [basePath, section]
  )
  const isChildActive = childHrefs.has(pathname)

  if (open && !isParentActive && !isChildActive) {
    setOpen(false)
  }

  return { open, setOpen, isParentActive, isChildActive }
}

function CompoundRefLink({
  basePath,
  section,
}: {
  basePath: string
  section: AbbrevCommonClientLibSection
}) {
  const { open, setOpen, isParentActive, isChildActive } = useCompoundRefLinkActive(
    basePath,
    section
  )

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(open) => void (!isParentActive && !isChildActive && setOpen(open))}
    >
      <Collapsible.Trigger asChild>
        <div
          className={cn(
            'cursor-pointer',
            'flex items-center justify-between gap-2',
            isParentActive && 'text-brand'
          )}
        >
          <RefLink
            basePath={basePath}
            section={section}
            skipChildren
            onClick={() => setOpen(true)}
          />
          <ChevronUp
            width={16}
            className={cn('data-open-parent:rotate-0 data-closed-parent:rotate-90', 'transition')}
          />
        </div>
      </Collapsible.Trigger>
      <Collapsible.Content
        className={cn('border-l border-control pl-3 ml-1 data-open:mt-2 grid gap-2.5')}
      >
        <ul>
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

export { RefLink }
