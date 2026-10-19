import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PanelBottomIcon,
  PanelRightIcon,
  XIcon,
} from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import type { TraceStep } from '../Trace/trace-view.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { Shortcut } from '@/components/ui/Shortcut'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface ServiceFlowPanelControlsProps {
  dock: 'bottom' | 'right'
  setDock: (value: 'bottom' | 'right') => void
  activeTab?: string
  traceSteps?: TraceStep[]
  traceSelectedId?: string | null
  onTraceSelectedIdChange?: (id: string | null) => void
}

export const ServiceFlowPanelControls = ({
  dock = 'bottom',
  setDock,
  activeTab = 'overview',
  traceSteps = [],
  traceSelectedId = null,
  onTraceSelectedIdChange,
}: ServiceFlowPanelControlsProps) => {
  const { table, openRowId, setOpenRowId, onSelectRow } = useDataTable()
  const rows = table.getRowModel().rows
  const index = rows.findIndex((row) => row.id === openRowId)
  const listPrevId = rows[index - 1]?.id
  const listNextId = rows[index + 1]?.id

  // While the Trace tab is active, up/down step through spans + log lines in
  // tree/chronological order instead of the main list — see ServiceFlowPanel,
  // which owns traceSteps/traceSelectedId so this and the Trace tab agree.
  const isTraceMode = activeTab === 'trace'
  const traceIndex =
    traceSelectedId !== null ? traceSteps.findIndex((step) => step.id === traceSelectedId) : -1
  const tracePrevId = traceIndex > 0 ? traceSteps[traceIndex - 1].id : undefined
  const traceNextId = traceIndex === -1 ? traceSteps[0]?.id : traceSteps[traceIndex + 1]?.id

  const prevId = isTraceMode ? tracePrevId : listPrevId
  const nextId = isTraceMode ? traceNextId : listNextId

  const handleNavigate = (id: string | undefined, shiftKey = false) => {
    if (!id) return
    if (isTraceMode) {
      onTraceSelectedIdChange?.(id)
      return
    }
    if (onSelectRow) onSelectRow(id, { shiftKey })
    else setOpenRowId(id)
    const row = document.getElementById(id)
    row?.scrollIntoView({ block: 'nearest' })
    if (document.activeElement?.closest('tbody')) row?.focus({ preventScroll: true })
  }
  const onPrev = () => handleNavigate(prevId)
  const onNext = () => handleNavigate(nextId)
  const onClose = () => setOpenRowId(undefined)

  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_PREV_ROW, () => handleNavigate(listPrevId, true), {
    enabled: !isTraceMode && !!listPrevId,
  })
  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_NEXT_ROW, () => handleNavigate(listNextId, true), {
    enabled: !isTraceMode && !!listNextId,
  })

  return (
    <div className="flex h-7 items-center gap-1">
      <Shortcut
        id={SHORTCUT_IDS.UNIFIED_LOGS_PREV_ROW}
        onTrigger={onPrev}
        options={{ enabled: !!prevId }}
        side="top"
      >
        <Button
          size="tiny"
          variant="text"
          aria-label="Previous log"
          disabled={!prevId}
          onClick={onPrev}
          className="px-1"
          icon={<ChevronUpIcon />}
        />
      </Shortcut>

      <Shortcut
        id={SHORTCUT_IDS.UNIFIED_LOGS_NEXT_ROW}
        onTrigger={onNext}
        options={{ enabled: !!nextId }}
        side="top"
      >
        <Button
          size="tiny"
          variant="text"
          aria-label="Next log"
          disabled={!nextId}
          onClick={onNext}
          className="px-1"
          icon={<ChevronDownIcon />}
        />
      </Shortcut>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            variant="text"
            className="px-1"
            icon={dock === 'bottom' ? <PanelBottomIcon /> : <PanelRightIcon />}
            tooltip={{ content: { side: 'top', text: 'Dock side' } }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuItem className="justify-between" onClick={() => setDock('bottom')}>
            <div className="flex items-center gap-x-2">
              <PanelBottomIcon size={14} />
              <span>Dock to bottom</span>
            </div>
            {dock === 'bottom' && <CheckIcon size={14} className="text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between" onClick={() => setDock('right')}>
            <div className="flex items-center gap-x-2">
              <PanelRightIcon size={14} />
              <span>Dock to right</span>
            </div>
            {dock === 'right' && <CheckIcon size={14} className="text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Shortcut
        id={SHORTCUT_IDS.UNIFIED_LOGS_CLOSE_PANEL}
        onTrigger={onClose}
        options={{ conflictBehavior: 'allow' }}
        side="top"
      >
        <Button
          aria-label="Clear selection"
          size="tiny"
          variant="text"
          onClick={onClose}
          className="px-1"
          icon={<XIcon />}
        />
      </Shortcut>
    </div>
  )
}
