import { useParams } from 'common'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { cloneElement, Dispatch, ReactNode, SetStateAction, useEffect } from 'react'
import { Badge, Button, cn, ResizablePanel, usePanelRef } from 'ui'

import { FeaturePreviewSidebarPanel } from '../FeaturePreviewSidebarPanel'
import { DateRangeDisabled } from './DataTable.types'
import { DataTableFilterControls } from './DataTableFilters/DataTableFilterControls'
import { DataTableResetButton } from './DataTableResetButton'
import { useDataTable } from './providers/DataTableProvider'
import { LOG_DRAIN_TYPES } from '@/components/interfaces/LogDrains/LogDrains.constants'
import { UserLogFilterControl } from '@/components/interfaces/UnifiedLogs/components/UserLogFilterControl'
import { UnifiedLogsBanner } from '@/components/interfaces/UnifiedLogs/UnifiedLogsBanner'
import { SidebarBreadcrumb } from '@/components/layouts/Navigation/SidebarBreadcrumb'

const LEVEL_OFFSET = 8
const LEVEL_TRANSITION = { duration: 0.09, ease: 'easeOut' } as const

interface FilterSideBarSection {
  label: string
  content: ReactNode
  action?: ReactNode
}

interface FilterSideBarProps {
  isFilterBarOpen: boolean
  setIsFilterBarOpen: Dispatch<SetStateAction<boolean>>
  dateRangeDisabled?: DateRangeDisabled
  /** When set, the panel swaps the filters out for this section's content. */
  section?: FilterSideBarSection
  /** Rendered above the filter controls, e.g. an entry into `section`. */
  savedViewsEntry?: ReactNode
  /** Called alongside the built-in filter reset, for filter state the caller owns. */
  onReset?: () => void
  onExitSection?: () => void
}

export function FilterSideBar({
  isFilterBarOpen,
  setIsFilterBarOpen,
  dateRangeDisabled,
  section,
  savedViewsEntry,
  onReset,
  onExitSection,
}: FilterSideBarProps) {
  const { ref } = useParams()
  const { table } = useDataTable()
  const [user, setUser] = useQueryState('user', parseAsString)
  const shouldReduceMotion = useReducedMotion()

  const panelRef = usePanelRef()

  useEffect(() => {
    if (isFilterBarOpen) {
      panelRef.current?.expand()
    } else {
      panelRef.current?.collapse()
    }
  }, [isFilterBarOpen, panelRef])

  const levelTransition = shouldReduceMotion ? { duration: 0 } : LEVEL_TRANSITION
  const levelOffset = shouldReduceMotion ? 0 : LEVEL_OFFSET
  const hasActiveFilters = table.getState().columnFilters.length > 0 || !!user

  return (
    <ResizablePanel
      panelRef={panelRef}
      minSize="256px"
      defaultSize="265px"
      maxSize="512px"
      groupResizeBehavior="preserve-pixel-size"
      id="panel-left"
      collapsible
      onResize={(size) => {
        if (size.inPixels === 0) {
          setIsFilterBarOpen(false)
        } else if (!isFilterBarOpen) {
          setIsFilterBarOpen(true)
        }
      }}
      className={cn('flex flex-col w-full')}
    >
      <div className="border-b border-border px-6 md:top-0">
        <div className="flex min-h-(--header-height) items-center justify-between gap-2">
          {section ? (
            <SidebarBreadcrumb
              aria-label="Logs sidebar navigation"
              label={section.label}
              parent={{ label: 'Logs', onClick: () => onExitSection?.() }}
              action={section.action}
            />
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <h4 className="text-foreground text-sm">Logs</h4>
                <Badge variant="default">Beta</Badge>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {hasActiveFilters ? (
                  <DataTableResetButton
                    onReset={() => {
                      setUser(null)
                      onReset?.()
                    }}
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {section ? (
            <motion.div
              key="section"
              initial={{ opacity: 0, x: levelOffset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: levelOffset }}
              transition={levelTransition}
              className="absolute inset-0 flex flex-col"
            >
              {section.content}
            </motion.div>
          ) : (
            <motion.div
              key="filters"
              initial={{ opacity: 0, x: -levelOffset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -levelOffset }}
              transition={levelTransition}
              className="absolute inset-0 flex flex-col"
            >
              <UnifiedLogsBanner />

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                {savedViewsEntry}
                <DataTableFilterControls
                  dateRangeDisabled={dateRangeDisabled}
                  itemsAfter={{ level: <UserLogFilterControl /> }}
                />
                <FeaturePreviewSidebarPanel
                  className="mx-1.5 mb-2"
                  title="Capture your logs"
                  description="Send logs to your preferred observability or storage platform."
                  illustration={
                    <div className="flex items-center gap-4">
                      {LOG_DRAIN_TYPES.filter((t) =>
                        ['datadog', 'sentry', 'webhook', 'loki'].includes(t.value)
                      ).map((type) =>
                        cloneElement(type.icon, { height: 20, width: 20, key: type.value })
                      )}
                    </div>
                  }
                  actions={
                    <Button asChild>
                      <Link href={`/project/${ref}/settings/log-drains`}>Go to Log Drains</Link>
                    </Button>
                  }
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ResizablePanel>
  )
}
