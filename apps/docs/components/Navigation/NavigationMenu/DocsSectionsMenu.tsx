'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useDocsPathname } from '~/features/IaNav/IaNavRouteProvider'
import { useRef, useState, type KeyboardEvent } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { isReferencePath } from './DocsSidebarNav.utils'

interface DocsSectionsMenuProps {
  className?: string
}

interface DocsSection {
  id: 'docs' | 'reference' | 'kb'
  label: string
  href: string
}

const DOCS_SECTIONS: DocsSection[] = [
  { id: 'docs', label: 'Docs', href: '/' },
  { id: 'reference', label: 'Reference', href: '/reference' },
  { id: 'kb', label: 'Knowledge base', href: 'https://supabase.com/kb' },
]

export const DocsSectionsMenu = ({ className }: DocsSectionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)
  const currentId = isReferencePath(useDocsPathname()) ? 'reference' : 'docs'
  const triggerRef = useRef<HTMLButtonElement>(null)

  // collapsible content stays open on an outside press, so a press outside the menu and its trigger closes it
  const handleContentRef = (content: HTMLDivElement | null) => {
    if (!content) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (content.contains(event.target) || triggerRef.current?.contains(event.target)) return
      closeMenu()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }

  // collapsible content has no escape key handling, so the root closes the menu
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !isOpen) return
    closeMenu()
    triggerRef.current?.focus()
  }

  const content = (
    <CollapsibleContent
      ref={handleContentRef}
      className="docs-sections-menu absolute left-0 -right-px top-full z-50 overflow-hidden border-r border-b bg-background"
    >
      <nav aria-label="Supabase sections" className="flex flex-col px-4 py-2">
        {DOCS_SECTIONS.map((section) => {
          const SectionLink = section.href.startsWith('/') ? Link : 'a'

          return (
            <SectionLink
              key={section.id}
              href={section.href}
              aria-current={section.id === currentId ? 'true' : undefined}
              onClick={closeMenu}
              className={cn(
                'flex min-h-8 items-center rounded-md pl-8 pr-2 text-sm text-foreground-light',
                'transition-colors hover:bg-surface-200 hover:text-foreground focus-ring',
                'focus-visible:bg-surface-200 focus-visible:text-foreground',
                'aria-[current=true]:text-foreground'
              )}
            >
              {section.label}
            </SectionLink>
          )
        })}
      </nav>
    </CollapsibleContent>
  )

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      onKeyDown={handleKeyDown}
      className={cn('flex', className)}
    >
      <CollapsibleTrigger
        ref={triggerRef}
        className="group flex h-8 cursor-pointer items-center gap-1.5 rounded-md pb-px text-sm font-medium leading-3.5 text-primary focus-ring"
      >
        {DOCS_SECTIONS.find((section) => section.id === currentId)?.label}
        <ChevronDown
          aria-hidden
          className="size-3.5 text-foreground-muted transition-transform duration-150 motion-reduce:transition-none group-aria-expanded:rotate-180"
        />
      </CollapsibleTrigger>
      {content}
    </Collapsible>
  )
}
