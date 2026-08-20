import { useParams } from 'common'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import {
  EXPLORER_SECTIONS,
  ExplorerResourceType,
  LEVEL_OFFSET,
  LEVEL_TRANSITION,
  rowClassName,
} from './ExplorerLayout.constants'
import { formatRelativeTimeShort, getRecentlyUpdatedItems } from './ExplorerNavHome.utils'
import { useCreateChat } from '@/components/interfaces/Explorer/hooks'
import { useNotebooksInfiniteQuery } from '@/data/content/notebooks/notebooks-infinite-query'
import { useAiAssistantChatList } from '@/state/ai-assistant-state'

export const ExplorerNavHome = ({
  onSelectSection,
}: {
  onSelectSection: (section: ExplorerResourceType) => void
}) => {
  const { ref } = useParams()
  const { openChat } = useCreateChat()

  const { data: notebooksData } = useNotebooksInfiniteQuery({ projectRef: ref, limit: 100 })
  const notebooks = notebooksData?.pages.flatMap((page) => page.content) ?? []
  const chats = useAiAssistantChatList()

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
              <span className="text-xs text-foreground-lighter">{/* Length will be here */}</span>
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
            const Icon = EXPLORER_SECTIONS.find((section) => section.type === item.type)?.icon

            if (item.type === 'chat') {
              return (
                <button
                  key={item.id}
                  type="button"
                  tabIndex={0}
                  className={rowClassName(false)}
                  onClick={() => openChat(item.id)}
                >
                  {Icon && <Icon size={14} className="shrink-0" />}
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  <span className="shrink-0 text-xs text-foreground-lighter">
                    {formatRelativeTimeShort(item.updatedAt)}
                  </span>
                </button>
              )
            } else {
              return (
                <Link
                  key={item.id}
                  href={`/project/${ref}/explorer/notebook/${item.id}`}
                  className={rowClassName(false)}
                >
                  {Icon && <Icon size={14} className="shrink-0" />}
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  <span className="shrink-0 text-xs text-foreground-lighter">
                    {formatRelativeTimeShort(item.updatedAt)}
                  </span>
                </Link>
              )
            }
          })
        )}
      </section>
    </motion.div>
  )
}
