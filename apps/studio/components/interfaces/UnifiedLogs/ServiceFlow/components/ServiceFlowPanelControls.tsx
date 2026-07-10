import { Check, ChevronDown, ChevronUp, PanelBottom, PanelRight, X } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { Shortcut } from '@/components/ui/Shortcut'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface ServiceFlowPanelControlsProps {
  dock: 'bottom' | 'right'
  setDock: (value: 'bottom' | 'right') => void
}

export const ServiceFlowPanelControls = ({
  dock = 'bottom',
  setDock,
}: ServiceFlowPanelControlsProps) => {
  const { table, openRowId, setOpenRowId, isLoading } = useDataTable()

  const selectedRowData = useMemo(() => {
    if (isLoading && !openRowId) return
    return table.getCoreRowModel().flatRows.find((row) => row.id === openRowId)
  }, [openRowId, isLoading, table])

  const index = table.getCoreRowModel().flatRows.findIndex((row) => row.id === selectedRowData?.id)

  const nextId = useMemo(
    () => table.getCoreRowModel().flatRows[index + 1]?.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, isLoading, table]
  )

  const prevId = useMemo(
    () => table.getCoreRowModel().flatRows[index - 1]?.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, isLoading, table]
  )

  const onPrev = useCallback(() => {
    if (prevId) setOpenRowId(prevId)
  }, [prevId, setOpenRowId])

  const onNext = useCallback(() => {
    if (nextId) setOpenRowId(nextId)
  }, [nextId, setOpenRowId])

  const onClose = useCallback(() => {
    setOpenRowId(undefined)
  }, [setOpenRowId])

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
          disabled={!nextId}
          onClick={onNext}
          className="px-1"
          icon={<ChevronDown />}
        />
      </Shortcut>

      <Separator orientation="vertical" className="mx-1 h-4" />

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
        <Button size="tiny" variant="text" onClick={onClose} className="px-1" icon={<X />} />
      </Shortcut>
    </div>
  )
}
