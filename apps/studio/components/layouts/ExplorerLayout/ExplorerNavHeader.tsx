import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from 'ui'

import {
  EXPLORER_SECTIONS,
  type ExplorerNavEntry,
  type ExplorerResourceType,
} from './ExplorerLayout.constants'
import { useCreateChat, useCreateNotebook } from '@/components/interfaces/Explorer/hooks'
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

  return (
    <>
      <Breadcrumb aria-label="Explorer navigation" className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap gap-1 text-sm sm:gap-1">
          {entry && (
            <>
              <BreadcrumbItem className="min-w-0">
                <Button
                  variant="text"
                  className="h-auto min-w-0 p-0 text-sm text-foreground-lighter hover:text-foreground [&>span]:truncate"
                  onClick={onBack}
                  title={parentLabel}
                >
                  {parentLabel}
                </Button>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="shrink-0" />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate text-sm" title={currentLabel}>
              {currentLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {!entry && rootAction}
      {(entry?.level === 'notebook' || entry?.level === 'chat') && (
        <ExplorerResourceAction type={entry.level} />
      )}
    </>
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
