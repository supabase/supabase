'use client'

import { useSidebarTopSlot } from '~/layouts/SidebarTopSlot'
import { isFeatureEnabled } from 'common'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

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
  ...(isFeatureEnabled('docs:navigation_dropdown_links_home')
    ? [{ label: 'Supabase.com', href: 'https://supabase.com' }]
    : []),
  { label: 'Guides', href: '/', isInternal: true },
  { label: 'Reference', href: '/reference/javascript', isInternal: true },
  { label: 'Knowledge Base', href: '/kb' },
]

export const DOCS_SECTIONS_MENU_HEIGHT_STYLE: DocsSectionsMenuHeightStyle = {
  '--docs-sections-menu-height': `calc(var(--spacing) * ${4 + 10 * DOCS_SECTIONS.length})`,
}

const LINK_CLASS_NAME =
  'flex min-h-10 items-center rounded-md pl-4 pr-2 text-sm text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground focus-ring'

export const DocsSectionsMenu = ({ className }: DocsSectionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)
  // with a sidebar, open inline at its top and push it down; otherwise overlay the page
  const { target: sidebarTopSlot } = useSidebarTopSlot()

  const content = (
    <CollapsibleContent
      data-docs-sections-menu
      style={DOCS_SECTIONS_MENU_HEIGHT_STYLE}
      className={cn(
        'docs-sections-menu overflow-hidden bg-background',
        !sidebarTopSlot && 'absolute left-0 -right-px top-full z-50 border-r border-b border-dashed'
      )}
    >
      <nav aria-label="Supabase sections" className="flex flex-col p-2">
        {DOCS_SECTIONS.map((section) =>
          section.isInternal ? (
            <Link
              key={section.label}
              href={section.href}
              onClick={closeMenu}
              className={LINK_CLASS_NAME}
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
      <CollapsibleTrigger className="group flex h-8 items-center gap-1.5 rounded-md pb-0.5 text-sm font-medium leading-3.5 text-foreground focus-ring">
        Docs
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
