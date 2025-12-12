import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'

import { useParams } from 'common'
import { EntityTypeIcon } from 'components/ui/EntityTypeIcon'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { editorEntityTypes, useTabsStateSnapshot } from 'state/tabs'
import { useEditorType } from '../editors/EditorsLayout.hooks'
import { LOAD_TAB_FROM_CACHE_PARAM } from 'components/grid/SupabaseGrid.utils'

export function RecentItems() {
  const { ref } = useParams()
  const tabs = useTabsStateSnapshot()
  const editor = useEditorType()

  if (!tabs?.recentItems || !ref) return null

  // Filter items based on editor type
  const filteredItems = !editor
    ? [...tabs.recentItems]
    : tabs.recentItems.filter((item) => editorEntityTypes[editor].includes(item.type))

  const sortedItems = filteredItems.sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="space-y-4">
      <h2 className="text-sm text-foreground">Recent items</h2>
      <div className="flex flex-col gap-0">
        {sortedItems.length === 0 ? (
          <motion.div
            layout
            initial={false}
            className="flex flex-col items-center justify-center p-8 text-center border rounded-md border-muted gap-3"
          >
            <EntityTypeIcon type={'r' as ENTITY_TYPE} />
            <div>
              <p className="text-xs text-foreground-light">No recent items yet</p>
              <p className="text-xs text-foreground-lighter">
                Items will appear here as you browse through your project
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 gap-12 gap-y-0">
              {sortedItems.map((item, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.012, duration: 0.15 }}
                >
                  <Link
                    href={`/project/${ref}/${
                      item.type === 'sql'
                        ? `sql/${item.metadata?.sqlId}`
                        : item.type === 'r' ||
                            item.type === 'v' ||
                            item.type === 'm' ||
                            item.type === 'f' ||
                            item.type === 'p'
                          ? `editor/${item.metadata?.tableId}?schema=${item.metadata?.schema}&${LOAD_TAB_FROM_CACHE_PARAM}=true`
                          : `explorer/${item.type}/${item.metadata?.schema}/${item.metadata?.name}`
                    }`}
                    className="flex items-center gap-4 rounded-lg bg-surface-100 py-2 transition-colors hover:bg-surface-200"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-surface-100 border">
                      <EntityTypeIcon type={item.type} />
                    </div>
                    <div className="flex flex-1 gap-5 items-center">
                      <span className="text-sm text-foreground">
                        <span className="text-foreground-lighter">{item.metadata?.schema}</span>
                        {item.metadata?.schema && <span className="text-foreground-light">.</span>}
                        <span className="text-foreground">{item.label || 'Untitled'}</span>
                      </span>
                      <div className="bg-border-muted flex grow h-px"></div>
                      <span className="text-xs text-foreground-lighter">
                        {dayjs(item.timestamp).fromNow()}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
