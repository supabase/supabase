import { useParams } from 'common'
import { Auth } from 'icons'
import { ChevronRightIcon, PlusIcon, SquareCodeIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Separator } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  EXPLORER_RESOURCE_SECTIONS,
  EXPLORER_TABLES_SECTION,
  LEVEL_OFFSET,
  LEVEL_TRANSITION,
  rowClassName,
  type ExplorerNavLevel,
  type ExplorerSection,
} from './ExplorerLayout.constants'
import { ExplorerSqlEditorFooter } from './ExplorerSqlEditorFooter'
import { entityQueryId } from '@/components/interfaces/Explorer/entityQuery.utils'
import { useCreateQuery, useOpenEntityQuery } from '@/components/interfaces/Explorer/hooks'
import { useContentCountQuery } from '@/data/content/content-count-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useAiAssistantChatList } from '@/state/ai-assistant-state'

/** Users are `auth.users`, opened like any other table rather than as a page of their own. */
const AUTH_USERS = { schema: 'auth', name: 'users', type: ENTITY_TYPE.TABLE }

const ExplorerSectionRow = ({
  section: { level, label, icon: Icon },
  count,
  onSelect,
}: {
  section: ExplorerSection
  count?: ReactNode
  onSelect: (level: ExplorerNavLevel) => void
}) => (
  <button
    type="button"
    tabIndex={0}
    className={rowClassName(false)}
    onClick={() => onSelect(level)}
  >
    <Icon size={14} className="shrink-0" />
    <span className="flex-1 text-left">{label}</span>
    {count}
    <ChevronRightIcon size={14} className="shrink-0 text-foreground-muted" />
  </button>
)

export const ExplorerNavHome = ({
  onSelectLevel,
}: {
  onSelectLevel: (level: ExplorerNavLevel) => void
}) => {
  const { ref, id } = useParams()

  const { createQuery } = useCreateQuery()
  const { openEntityQuery } = useOpenEntityQuery()
  const isUsersOpen = id === entityQueryId(AUTH_USERS)

  const chats = useAiAssistantChatList()

  const { data: notebookCountData, isPending } = useContentCountQuery({
    projectRef: ref,
    type: 'notebook',
  })
  // [Joshen] Notebooks are all shared by default, none private
  const notebookCount = notebookCountData?.shared ?? 0

  return (
    <motion.div
      key="root"
      role="group"
      aria-label="All resources"
      initial={{ opacity: 0, x: -LEVEL_OFFSET }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -LEVEL_OFFSET }}
      transition={LEVEL_TRANSITION}
      className="absolute inset-0 flex flex-col overflow-hidden"
    >
      <nav className="flex-1 min-h-0 flex flex-col gap-px overflow-y-auto p-3">
        {/* Working with the database directly: a table opens as a query, as do Users and Run SQL. */}
        <ExplorerSectionRow section={EXPLORER_TABLES_SECTION} onSelect={onSelectLevel} />
        <button
          type="button"
          tabIndex={0}
          aria-current={isUsersOpen ? 'page' : undefined}
          className={rowClassName(isUsersOpen)}
          onClick={() => openEntityQuery(AUTH_USERS)}
        >
          <Auth size={14} className="shrink-0" />
          <span className="flex-1 text-left">Users</span>
        </button>
        <button
          type="button"
          tabIndex={0}
          className={rowClassName(false)}
          onClick={() => createQuery()}
        >
          <SquareCodeIcon size={14} className="shrink-0" />
          <span className="flex-1 text-left">Run SQL</span>
          <PlusIcon size={14} className="shrink-0 text-foreground-muted" />
        </button>
        <Separator className="my-2" />
        {/* Saved work, each with a list behind it. */}
        {EXPLORER_RESOURCE_SECTIONS.map((section) => (
          <ExplorerSectionRow
            key={section.level}
            section={section}
            onSelect={onSelectLevel}
            count={
              section.level === 'notebook' && isPending ? (
                <ShimmeringLoader className="w-3 py-2" />
              ) : (
                <span className="text-xs text-foreground-lighter">
                  {section.level === 'notebook' ? notebookCount : chats.length}
                </span>
              )
            }
          />
        ))}
      </nav>

      <ExplorerSqlEditorFooter />
    </motion.div>
  )
}
