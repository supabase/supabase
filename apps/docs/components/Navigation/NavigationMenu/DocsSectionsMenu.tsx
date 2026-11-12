'use client'

import { useSidebarTopSlot } from '~/layouts/SidebarTopSlot'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useDocsPathname } from '~/features/IaNav/IaNavRouteProvider'
import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
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

interface DocsSectionsMenuHeightStyle extends CSSProperties {
  '--docs-sections-menu-height': string
}

const DOCS_SECTIONS: DocsSection[] = [
  { id: 'docs', label: 'Docs', href: '/' },
  { id: 'reference', label: 'Reference', href: '/reference' },
  { id: 'kb', label: 'Knowledge base', href: 'https://supabase.com/kb' },
]

// the cell border moves with the menu, but only the menu gets the radix height, so the cell counts the links
export const DOCS_SECTIONS_MENU_HEIGHT_STYLE: DocsSectionsMenuHeightStyle = {
  '--docs-sections-menu-height': `calc(var(--spacing) * ${4 + 8 * DOCS_SECTIONS.length})`,
}

export const DocsSectionsMenu = ({ className }: DocsSectionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)
  const { target: sidebarTopSlot } = useSidebarTopSlot()
  const currentId = isReferencePath(useDocsPathname()) ? 'reference' : 'docs'
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLElement>(null)

  // the menu can render in the sidebar, so a press outside the menu and its trigger closes it
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

  // in the sidebar the menu comes after the whole top bar, so tab moves between it and the trigger
  const moveFocusAcrossPortal = (event: KeyboardEvent<HTMLDivElement>) => {
    const firstLink = menuRef.current?.querySelector('a')
    if (!firstLink) return
    if (!event.shiftKey && event.target === triggerRef.current) {
      event.preventDefault()
      firstLink.focus()
    }
    if (event.shiftKey && event.target === firstLink) {
      event.preventDefault()
      triggerRef.current?.focus()
    }
  }

  // the content can sit in the sidebar portal, but its key events still reach the root
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return
    if (event.key === 'Escape') {
      closeMenu()
      triggerRef.current?.focus()
    }
    if (event.key === 'Tab' && sidebarTopSlot) moveFocusAcrossPortal(event)
  }

  const content = (
    <CollapsibleContent
      ref={handleContentRef}
      className={cn(
        'docs-sections-menu overflow-hidden bg-background',
        !sidebarTopSlot && 'absolute left-0 -right-px top-full z-50 border-r border-b'
      )}
    >
      <nav ref={menuRef} aria-label="Supabase sections" className="flex flex-col px-4 py-2">
        {DOCS_SECTIONS.map((section) => {
          const SectionLink = section.href.startsWith('/') ? Link : 'a'

          return (
            <SectionLink
              key={section.id}
              href={section.href}
              aria-current={section.id === currentId ? 'true' : undefined}
              onClick={closeMenu}
              className={cn(
                'flex h-8 items-center rounded-md pl-8 pr-2 text-sm text-foreground-light',
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
      data-docs-sections-root
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
      {sidebarTopSlot ? createPortal(content, sidebarTopSlot) : content}
    </Collapsible>
  )
}
