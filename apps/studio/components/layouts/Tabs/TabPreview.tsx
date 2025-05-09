import { motion } from 'framer-motion'

import { useParams } from 'common'
import { EntityTypeIcon } from 'components/ui/EntityTypeIcon'
import { useTabsStateSnapshot } from 'state/tabs'

export const TabPreview = ({ tab }: { tab: string }) => {
  const { ref } = useParams()
  const tabs = useTabsStateSnapshot()

  const tabData = tabs.tabsMap[tab]

  if (!tabData) return null

  return (
    <motion.div
      layoutId={tab}
      transition={{ duration: 0.045 }}
      animate={{ opacity: 0.7 }}
      className="flex relative items-center gap-2 px-3 text-xs bg-dash-sidebar dark:bg-surface-100 shadow-lg rounded-sm h-10"
    >
      <EntityTypeIcon type={tabData.type} />
      <span>{tabData.label || 'Untitled'}</span>
      <div className="absolute w-full top-0 left-0 right-0 h-px bg-foreground-muted" />
    </motion.div>
  )
}
