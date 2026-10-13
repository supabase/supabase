import { useParams } from 'common'
import { motion } from 'framer-motion'
import { ChevronRight, Plus, SquareCode } from 'lucide-react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  EXPLORER_SECTIONS,
  ExplorerResourceType,
  LEVEL_OFFSET,
  LEVEL_TRANSITION,
  rowClassName,
} from './ExplorerLayout.constants'
import { formatRelativeTimeShort, getRecentlyUpdatedItems } from './ExplorerNavHome.utils'
import { ExplorerNavItem } from './ExplorerNavItem'
import { useExplorerDeleteItem } from './ExplorerProvider'
import { ExplorerSqlEditorFooter } from './ExplorerSqlEditorFooter'
import { useCreateQuery } from '@/components/interfaces/Explorer/hooks'
import { useContentCountQuery } from '@/data/content/content-count-query'
import { useNotebooksInfiniteQuery } from '@/data/content/notebooks/notebooks-infinite-query'
import { useAiAssistantChatList } from '@/state/ai-assistant-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const ExplorerNavHome = ({
  onSelectSection,
}: {
  onSelectSection: (section: ExplorerResourceType) => void
}) => {
  const { id, ref } = useParams()
  const tabs = useTabsStateSnapshot()

  const { createQuery } = useCreateQuery()
  const { onSelectDelete } = useExplorerDeleteItem()

  const { data: notebooksData } = useNotebooksInfiniteQuery({ projectRef: ref, limit: 100 })
  const notebooks = notebooksData?.pages.flatMap((page) => page.content) ?? []
  const chats = useAiAssistantChatList()

  const { data: notebookCountData, isPending } = useContentCountQuery({
    projectRef: ref,
    type: 'notebook',
  })
  // [Joshen] Notebooks are all shared by default, none private
  const notebookCount = notebookCountData?.shared ?? 0

  const recentItems = getRecentlyUpdatedItems({ notebooks, chats })

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
      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto p-3">
        <nav className="flex flex-col gap-px">
          <button
            type="button"
            tabIndex={0}
            className={rowClassName(false)}
            onClick={() => createQuery()}
          >
            <SquareCode size={14} className="shrink-0" />
            <span className="flex-1 text-left">Run SQL</span>
            <Plus size={14} className="shrink-0 text-foreground-muted" />
          </button>
          {EXPLORER_SECTIONS.map(({ type, label, icon: Icon }) => {
            return (
              <button
                key={type}
                type="button"
                tabIndex={0}
                className={rowClassName(false)}
                onClick={() => onSelectSection(type)}
              >
                <Icon size={14} className="shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {type === 'notebook' ? (
                  isPending ? (
                    <ShimmeringLoader className="w-3 py-2" />
                  ) : (
                    <span className="text-xs text-foreground-lighter">{notebookCount}</span>
                  )
                ) : (
                  <span className="text-xs text-foreground-lighter">{chats.length}</span>
                )}
                <ChevronRight size={14} className="shrink-0 text-foreground-muted" />
              </button>
            )
          })}
        </nav>

        <section className="flex flex-col gap-px">
          <h3 className="mb-2 px-2 font-mono text-sm font-normal uppercase text-foreground-lighter">
            Recently updated
          </h3>
          {recentItems.length === 0 ? (
            <p className="px-2 text-xs text-foreground-lighter">Nothing edited yet</p>
          ) : (
            recentItems.map((item) => {
              const isActive = id === item.id

              const href =
                item.type === 'chat'
                  ? `/project/${ref}/explorer/chat/${item.id}`
                  : `/project/${ref}/explorer/notebook/${item.id}`

              const onDoubleClick = () => {
                if (item.type === 'chat') {
                  tabs.makeTabPermanent(createTabId('chat', { id: item.id }))
                } else {
                  tabs.makeTabPermanent(createTabId('notebook', { id: item.id }))
                }
              }

              return (
                <ExplorerNavItem
                  key={item.id}
                  type={item.type}
                  href={href}
                  name={item.label}
                  isActive={isActive}
                  onDoubleClick={onDoubleClick}
                  onSelectDelete={() =>
                    onSelectDelete({ id: item.id, type: item.type, name: item.label })
                  }
                  description={formatRelativeTimeShort(item.updatedAt)}
                />
              )
            })
          )}
        </section>
      </div>

      <ExplorerSqlEditorFooter />
    </motion.div>
  )
}
