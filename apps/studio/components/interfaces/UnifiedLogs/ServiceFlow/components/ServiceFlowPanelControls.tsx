import { Check, ChevronDown, ChevronUp, PanelBottom, PanelRight, X } from 'lucide-react'
import { useMemo } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  useDataTable,
  useDataTableSelection,
  useDataTableSelectionActions,
} from '@/components/ui/DataTable/providers/DataTableProvider'
import { Shortcut } from '@/components/ui/Shortcut'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface ServiceFlowPanelControlsProps {
  dock: 'bottom' | 'right'
  setDock: (value: 'bottom' | 'right') => void
}

export const ServiceFlowPanelControls = ({
  dock = 'bottom',
  setDock,
}: ServiceFlowPanelControlsProps) => {
  const { table } = useDataTable()
  const { openRowId } = useDataTableSelection()
  const { setOpenRowId, onSelectRow, rowNavigationRef } = useDataTableSelectionActions()
  const rows = table.getRowModel().rows
  const indexById = useMemo(() => new Map(rows.map((row, index) => [row.id, index])), [rows])
  const index = openRowId ? (indexById.get(openRowId) ?? -1) : -1
  const prevId = rows[index - 1]?.id
  const nextId = rows[index + 1]?.id

  const handleNavigate = (id: string | undefined, shiftKey = false) => {
    if (!id) return
    if (onSelectRow) onSelectRow(id, { shiftKey })
    else setOpenRowId(id)
    rowNavigationRef.current?.scrollToRow(id, !!document.activeElement?.closest('tbody'))
  }
  const onPrev = () => handleNavigate(prevId)
  const onNext = () => handleNavigate(nextId)
  const onClose = () => setOpenRowId(undefined)

  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_PREV_ROW, () => handleNavigate(prevId, true), {
    enabled: !!prevId,
  })
  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_NEXT_ROW, () => handleNavigate(nextId, true), {
    enabled: !!nextId,
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
          icon={<ChevronUp />}
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
          icon={<ChevronDown />}
        />
      </Shortcut>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            variant="text"
            className="px-1"
            icon={dock === 'bottom' ? <PanelBottom /> : <PanelRight />}
            tooltip={{ content: { side: 'top', text: 'Dock side' } }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuItem className="justify-between" onClick={() => setDock('bottom')}>
            <div className="flex items-center gap-x-2">
              <PanelBottom size={14} />
              <span>Dock to bottom</span>
            </div>
            {dock === 'bottom' && <Check size={14} className="text-brand" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between" onClick={() => setDock('right')}>
            <div className="flex items-center gap-x-2">
              <PanelRight size={14} />
              <span>Dock to right</span>
            </div>
            {dock === 'right' && <Check size={14} className="text-brand" />}
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
          icon={<X />}
        />
      </Shortcut>
    </div>
  )
}
