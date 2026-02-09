import { HelpContent } from 'components/layouts/ProjectLayout/LayoutHeader/HelpPopover'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { X } from 'lucide-react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

export const HelpPanel = () => {
  const { closeSidebar } = useSidebarManagerSnapshot()

  const handleClose = () => {
    closeSidebar(SIDEBAR_KEYS.HELP_PANEL)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pl-4 pr-3 py-2 border-b">
        <h3 className="text-xs">Help & Support</h3>
        <ButtonTooltip
          type="text"
          className="w-7 h-7 p-0"
          icon={<X strokeWidth={1.5} />}
          onClick={handleClose}
          tooltip={{ content: { side: 'bottom', text: 'Close Help & Support' } }}
        />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <HelpContent onClose={handleClose} />
      </div>
    </div>
  )
}
