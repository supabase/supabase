import { XIcon } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Button, SidebarProvider } from 'ui'

import { OrganizationDropdown } from '@/components/layouts/AppLayout/OrganizationDropdown'
import { ProjectDropdown } from '@/components/layouts/AppLayout/ProjectDropdown'
import { HomeIcon } from '@/components/layouts/Navigation/LayoutHeader/HomeIcon'
import { LayoutHeaderDivider } from '@/components/layouts/Navigation/LayoutHeader/LayoutHeaderDivider'
import { OrgSelector } from '@/components/layouts/Navigation/NavigationBar/OrgSelector'

export const PipelineCreationHeader = ({
  onClose,
  onNavigate,
}: {
  onClose: () => void
  onNavigate: (href: string) => void
}) => {
  const handleLinkClick = (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    const link = event.target instanceof Element ? event.target.closest('a') : null
    if (!link || link.target === '_blank') return
    event.preventDefault()
    event.stopPropagation()
    onNavigate(link.href)
  }

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-dash-sidebar px-3 md:px-4"
      onClickCapture={handleLinkClick}
    >
      <nav
        aria-label="Pipeline creation"
        className="hide-scrollbar flex min-w-0 items-center gap-2 overflow-x-auto text-sm md:gap-0"
      >
        <HomeIcon className="md:mr-2" />
        <LayoutHeaderDivider className="hidden shrink-0 md:block" />
        <div className="hidden md:block">
          <OrganizationDropdown />
        </div>
        <div className="md:hidden">
          <SidebarProvider defaultOpen={false} className="contents">
            <OrgSelector />
          </SidebarProvider>
        </div>
        <LayoutHeaderDivider className="hidden shrink-0 md:block" />
        <ProjectDropdown />
        <LayoutHeaderDivider className="hidden shrink-0 md:block" />
        <span className="shrink-0 text-foreground">New pipeline</span>
      </nav>
      <Button
        type="button"
        variant="text"
        icon={<XIcon size={16} />}
        className="shrink-0 px-1"
        aria-label="Close"
        onClick={onClose}
      />
    </header>
  )
}
