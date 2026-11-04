'use client'

import { useSidebarTopSlot } from '~/layouts/SidebarTopSlot'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { isReferencePath } from './DocsSidebarNav'

interface DocsSectionsMenuProps {
  className?: string
}

interface DocsSection {
  label: string
  href: string
  isInternal?: boolean
}

interface DocsSectionsMenuHeightStyle extends CSSProperties {
  '--docs-sections-menu-height': string
}

const DOCS_SECTIONS: DocsSection[] = [
  { label: 'Docs', href: '/', isInternal: true },
  { label: 'Reference', href: '/reference', isInternal: true },
  { label: 'Knowledge base', href: '/kb' },
]

export const DOCS_SECTIONS_MENU_HEIGHT_STYLE: DocsSectionsMenuHeightStyle = {
  '--docs-sections-menu-height': `calc(var(--spacing) * ${4 + 8 * DOCS_SECTIONS.length})`,
}

const LINK_CLASS_NAME =
  'flex min-h-8 items-center rounded-md pl-8 pr-2 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground focus-ring'

export const DocsSectionsMenu = ({ className }: DocsSectionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)
  // with a sidebar, the menu opens inside it, not over the page
  const { target: sidebarTopSlot } = useSidebarTopSlot()
  const currentLabel = isReferencePath(usePathname() ?? '') ? 'Reference' : 'Docs'
  const triggerRef = useRef<HTMLButtonElement>(null)

  // the menu can render in the sidebar, so a press outside the menu and its trigger closes it
  const handleContentRef = (content: HTMLDivElement | null) => {
    if (!content) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (content.contains(event.target) || triggerRef.current?.contains(event.target)) return
      setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }

  const content = (
    <CollapsibleContent
      ref={handleContentRef}
      data-docs-sections-menu
      style={DOCS_SECTIONS_MENU_HEIGHT_STYLE}
      className={cn(
        'docs-sections-menu overflow-hidden bg-background',
        !sidebarTopSlot && 'absolute left-0 -right-px top-full z-50 border-r border-b'
      )}
    >
      <nav aria-label="Supabase sections" className="flex flex-col px-4 py-2">
        {DOCS_SECTIONS.map((section) =>
          section.isInternal ? (
            <Link
              key={section.label}
              href={section.href}
              aria-current={section.label === currentLabel ? 'true' : undefined}
              onClick={closeMenu}
              className={cn(LINK_CLASS_NAME, 'aria-[current=true]:text-foreground')}
            >
              {section.label}
            </Link>
          ) : (
            <a
              key={section.label}
              href={section.href}
              onClick={closeMenu}
              className={LINK_CLASS_NAME}
            >
              {section.label}
            </a>
          )
        )}
      </nav>
    </CollapsibleContent>
  )

  return (
    <Collapsible
      data-docs-sections-root
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('flex', className)}
    >
      <CollapsibleTrigger
        ref={triggerRef}
        className="group flex h-8 cursor-pointer items-center gap-1.5 rounded-md pb-0.5 text-sm font-medium leading-3.5 text-primary focus-ring"
      >
        {currentLabel}
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className="text-foreground-muted transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      {sidebarTopSlot ? createPortal(content, sidebarTopSlot) : content}
    </Collapsible>
  )
}
