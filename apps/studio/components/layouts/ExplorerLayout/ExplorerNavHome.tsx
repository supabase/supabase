import { useParams } from 'common'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import {
  EXPLORER_RESOURCES,
  EXPLORER_SECTIONS,
  LEVEL_OFFSET,
  LEVEL_TRANSITION,
  rowClassName,
  type ExplorerNavLevel,
} from './ExplorerLayout.constants'
import { formatRelativeTimeShort, getRecentlyUpdatedItems } from './ExplorerNavHome.utils'
import { useCreateChat } from '@/components/interfaces/Explorer/hooks'
import { useContentCountQuery } from '@/data/content/content-count-query'
import { useNotebooksInfiniteQuery } from '@/data/content/notebooks/notebooks-infinite-query'
import { useAiAssistantChatList } from '@/state/ai-assistant-state'

export const ExplorerNavHome = ({
  onSelectLevel,
}: {
  onSelectLevel: (level: ExplorerNavLevel) => void
}) => {
  const { ref } = useParams()
  const { openChat } = useCreateChat()

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
      className="absolute inset-0 flex flex-col gap-4 overflow-y-auto p-3"
    >
      <nav className="flex flex-col gap-px">
        {EXPLORER_SECTIONS.map(({ level, label, icon: Icon }) => {
          return (
            <button
              key={level}
              type="button"
              tabIndex={0}
              className={rowClassName(false)}
              onClick={() => onSelectLevel(level)}
            >
              <Icon size={14} className="shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {level === 'notebook' && isPending && <ShimmeringLoader className="w-3 py-2" />}
              {level === 'notebook' && !isPending && (
                <span className="text-xs text-foreground-lighter">{notebookCount}</span>
              )}
              {level === 'chat' && (
                <span className="text-xs text-foreground-lighter">{chats.length}</span>
              )}
              <ChevronRight size={14} className="shrink-0 text-foreground-muted" />
            </button>
          )
        })}
      </nav>

      <section className="flex flex-col gap-px">
        <h3 className="mb-2 px-3 font-mono text-sm font-normal uppercase text-foreground-lighter">
          Recently updated
        </h3>
        {recentItems.length === 0 ? (
          <p className="px-3 text-xs text-foreground-lighter">Nothing edited yet</p>
        ) : (
          recentItems.map((item) => {
            const { icon: Icon } = EXPLORER_RESOURCES[item.type]
            const content = (
              <>
                <Icon size={14} className="shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate text-left">{item.label}</span>
                <span className="shrink-0 text-xs text-foreground-lighter">
                  {formatRelativeTimeShort(item.updatedAt)}
                </span>
              </>
            )

            return item.type === 'chat' ? (
              <button
                key={item.id}
                type="button"
                tabIndex={0}
                className={rowClassName(false)}
                onClick={() => openChat(item.id)}
              >
                {content}
              </button>
            ) : (
              <Link
                key={item.id}
                href={`/project/${ref}/explorer/notebook/${item.id}`}
                className={rowClassName(false)}
              >
                {content}
              </Link>
            )
          })
        )}
      </section>
    </motion.div>
  )
}
