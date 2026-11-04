'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const LINK_CLASS_NAME =
  'flex min-h-8 items-center rounded-md pl-8 pr-2 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground focus-ring'

export const DocsSectionsMenu = ({ className }: DocsSectionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)
  const currentId = isReferencePath(usePathname() ?? '') ? 'reference' : 'docs'
  const triggerRef = useRef<HTMLButtonElement>(null)

  // collapsible content stays open on an outside press, so a press outside the menu and its trigger closes it
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

  // collapsible content has no escape key handling, so the root closes the menu
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !isOpen) return
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const content = (
    <CollapsibleContent
      ref={handleContentRef}
      data-docs-sections-menu
      className="docs-sections-menu absolute left-0 -right-px top-full z-50 overflow-hidden border-r border-b bg-background"
    >
      <nav aria-label="Supabase sections" className="flex flex-col px-4 py-2">
        {DOCS_SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            aria-current={section.id === currentId ? 'true' : undefined}
            onClick={closeMenu}
            className={cn(LINK_CLASS_NAME, 'aria-[current=true]:text-foreground')}
          >
            {section.label}
          </Link>
        ))}
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
        className="group flex h-8 cursor-pointer items-center gap-1.5 rounded-md pb-0.5 text-sm font-medium leading-3.5 text-primary focus-ring"
      >
        {DOCS_SECTIONS.find((section) => section.id === currentId)?.label}
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className="text-foreground-muted transition-transform duration-150 motion-reduce:transition-none group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      {content}
    </Collapsible>
  )
}
