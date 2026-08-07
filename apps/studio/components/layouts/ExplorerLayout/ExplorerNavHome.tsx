import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

import {
  EXPLORER_SECTIONS,
  ExplorerResourceType,
  LEVEL_OFFSET,
  LEVEL_TRANSITION,
  rowClassName,
} from './ExplorerLayout.constants'

export const ExplorerNavHome = ({
  onSelectSection,
}: {
  onSelectSection: (section: ExplorerResourceType) => void
}) => {
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
          Recent
        </h3>
        <p className="px-3 text-xs text-foreground-lighter">Nothing edited yet</p>
      </section>
    </motion.div>
  )
}
