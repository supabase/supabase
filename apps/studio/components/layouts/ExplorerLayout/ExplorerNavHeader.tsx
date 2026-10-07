import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

import { EXPLORER_SECTIONS, type ExplorerResourceType } from './ExplorerLayout.constants'
import { useCreateChat, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import { SidebarBreadcrumb } from '@/components/layouts/Navigation/SidebarBreadcrumb'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export const ExplorerNavHeader = ({
  section,
  onBack,
  rootAction,
}: {
  section: ExplorerResourceType | undefined
  onBack: () => void
  rootAction?: ReactNode
}) => {
  const label = EXPLORER_SECTIONS.find((entry) => entry.type === section)?.label ?? 'Explorer'

  return (
    <SidebarBreadcrumb
      aria-label="Explorer navigation"
      label={label}
      parent={section ? { label: 'Explorer', onClick: onBack } : undefined}
      action={section ? <ExplorerResourceAction type={section} /> : rootAction}
    />
  )
}

const ExplorerResourceAction = ({ type }: { type: ExplorerResourceType }) => {
  const { createNotebook } = useCreateNotebook()
  const { createChat } = useCreateChat()

  return (
    <ButtonTooltip
      size="tiny"
      variant="outline"
      aria-label={`New ${type}`}
      className="size-7 shrink-0 px-0"
      icon={<Plus />}
      tooltip={{ content: { side: 'bottom', text: `New ${type}` } }}
      onClick={() => {
        if (type === 'notebook') createNotebook()
        if (type === 'chat') createChat()
      }}
    />
  )
}
