import { Check, ChevronDown, ChevronUp, PanelBottom, PanelRight, X } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
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
  const { table, openRowId, setOpenRowId, onSelectRow } = useDataTable()
  const rows = table.getRowModel().rows
  const index = rows.findIndex((row) => row.id === openRowId)
  const prevId = rows[index - 1]?.id
  const nextId = rows[index + 1]?.id

  const handleNavigate = (id: string | undefined, shiftKey = false) => {
    if (!id) return
    if (onSelectRow) onSelectRow(id, { shiftKey })
    else setOpenRowId(id)
    const row = document.getElementById(id)
    row?.scrollIntoView({ block: 'nearest' })
    if (document.activeElement?.closest('tbody')) row?.focus({ preventScroll: true })
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
            {dock === 'bottom' && <Check size={14} className="text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem className="justify-between" onClick={() => setDock('right')}>
            <div className="flex items-center gap-x-2">
              <PanelRight size={14} />
              <span>Dock to right</span>
            </div>
            {dock === 'right' && <Check size={14} className="text-primary" />}
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
