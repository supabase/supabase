import { PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  EXPLORER_SECTIONS,
  type ExplorerNavLevel,
  type ExplorerResourceType,
} from './ExplorerLayout.constants'
import { useCreateChat, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import { SidebarBreadcrumb } from '@/components/layouts/Navigation/SidebarBreadcrumb'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

const ROOT_LABEL = 'Explorer'

export const ExplorerNavHeader = ({
  level,
  onBack,
  rootAction,
}: {
  /** The open section, or `undefined` at the root. */
  level: ExplorerNavLevel | undefined
  onBack: () => void
  rootAction?: ReactNode
}) => {
  const label = EXPLORER_SECTIONS.find((section) => section.level === level)?.label ?? ROOT_LABEL
  let action = rootAction
  if (level !== undefined) {
    action =
      level === 'notebook' || level === 'chat' ? <ExplorerResourceAction type={level} /> : undefined
  }

  return (
    <SidebarBreadcrumb
      aria-label="Explorer navigation"
      label={label}
      parent={level !== undefined ? { label: ROOT_LABEL, onClick: onBack } : undefined}
      action={action}
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
      icon={<PlusIcon />}
      tooltip={{ content: { side: 'bottom', text: `New ${type}` } }}
      onClick={() => {
        if (type === 'notebook') createNotebook()
        if (type === 'chat') createChat()
      }}
    />
  )
}
