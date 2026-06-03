import { motion } from 'framer-motion'
import { cn } from 'ui'

import { SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME } from '../SQLEditorLayout/SQLEditorNavV2/SQLEditorNav.constants'
import { EntityTypeIcon } from '@/components/ui/EntityTypeIcon'
import { useTabsStateSnapshot } from '@/state/tabs'

export const TabPreview = ({
  tab,
  variant = 'default',
}: {
  tab: string
  variant?: 'default' | 'toggle-group'
}) => {
  const tabs = useTabsStateSnapshot()

  const tabData = tabs.tabsMap[tab]

  if (!tabData) return null

  return (
    <motion.div
      layoutId={tab}
      transition={{ duration: 0.045 }}
      animate={{ opacity: 0.7 }}
      className={cn(
        'relative flex items-center text-xs shadow-lg',
        variant === 'toggle-group'
          ? cn(
              'max-w-[240px] gap-1.5 overflow-hidden rounded-md bg-surface-300 px-2',
              SQL_EDITOR_SIDEBAR_SEARCH_ROW_HEIGHT_CLASSNAME
            )
          : 'h-10 gap-2 rounded-xs bg-dash-sidebar px-3 dark:bg-surface-100'
      )}
    >
      <span className={variant === 'toggle-group' ? 'shrink-0' : undefined}>
        <EntityTypeIcon type={tabData.type} />
      </span>
      <span className={cn(variant === 'toggle-group' && 'min-w-0 truncate')}>
        {tabData.label || 'Untitled'}
      </span>
      {variant === 'default' && (
        <div className="absolute w-full top-0 left-0 right-0 h-px bg-foreground-muted" />
      )}
    </motion.div>
  )
}
