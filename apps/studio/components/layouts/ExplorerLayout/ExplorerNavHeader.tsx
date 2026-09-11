import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  EXPLORER_SECTIONS,
  type ExplorerNavEntry,
  type ExplorerResourceType,
} from './ExplorerLayout.constants'
import { useCreateChat, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
import { SidebarBreadcrumb } from '@/components/layouts/Navigation/SidebarBreadcrumb'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

const getLevelLabel = (entry: ExplorerNavEntry | undefined) => {
  if (!entry) return 'Explorer'
  if (entry.level === 'database-schema') return entry.schema
  if (entry.level === 'database-tables') return 'Tables'
  return EXPLORER_SECTIONS.find((section) => section.level === entry.level)?.label ?? 'Explorer'
}

export const ExplorerNavHeader = ({
  navStack,
  onBack,
  rootAction,
}: {
  navStack: readonly ExplorerNavEntry[]
  onBack: () => void
  rootAction?: ReactNode
}) => {
  const entry = navStack.at(-1)
  const parentLabel = getLevelLabel(navStack.at(-2))
  const currentLabel = getLevelLabel(entry)
  let action = rootAction
  if (entry) {
    action =
      entry.level === 'notebook' || entry.level === 'chat' ? (
        <ExplorerResourceAction type={entry.level} />
      ) : undefined
  }

  return (
    <SidebarBreadcrumb
      aria-label="Explorer navigation"
      label={currentLabel}
      parent={entry ? { label: parentLabel, onClick: onBack } : undefined}
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
      icon={<Plus />}
      tooltip={{ content: { side: 'bottom', text: `New ${type}` } }}
      onClick={() => {
        if (type === 'notebook') createNotebook()
        if (type === 'chat') createChat()
      }}
    />
  )
}
