'use client'

import type { SidebarSection } from './AccountLayout.types'
import { getActiveKey, toSubMenuSections } from './AccountLayout.utils'
import { SubMenu } from '@/components/ui/ProductMenu/SubMenu'

export interface AccountMenuContentProps {
  sections: SidebarSection[]
  onCloseSheet?: () => void
}

export function AccountMenuContent({ sections, onCloseSheet }: AccountMenuContentProps) {
  const subMenuSections = toSubMenuSections(sections)
  const page = getActiveKey(sections)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <nav className="px-2 py-2" aria-label="Account menu">
        <SubMenu sections={subMenuSections} page={page} onItemClick={onCloseSheet} />
      </nav>
    </div>
  )
}
