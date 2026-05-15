import { Check, ChevronDown, ChevronUp, PanelBottom, PanelRight, X } from 'lucide-react'
import { useCallback, useEffect, useMemo } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  KeyboardShortcut,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'

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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!openRowId) return

      const activeElement = document.activeElement
      if (activeElement?.closest('[role="menu"]')) return

      const tag = activeElement?.tagName
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (activeElement as HTMLElement | null)?.isContentEditable ||
        activeElement?.getAttribute('role') === 'textbox'
      if (isEditable) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        onPrev()
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        onNext()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [openRowId, onNext, onPrev])

  return (
    <div className="flex h-7 items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="tiny"
            type="text"
            disabled={!prevId}
            onClick={onPrev}
            className="px-1"
            icon={<ChevronUp />}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-2">
          <span>Previous</span>
          <KeyboardShortcut keys={['ArrowUp']} />
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="tiny"
            type="text"
            disabled={!nextId}
            onClick={onNext}
            className="px-1"
            icon={<ChevronDown />}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-2">
          <span>Next</span>
          <KeyboardShortcut keys={['ArrowDown']} />
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-4" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ButtonTooltip
            type="text"
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="tiny" type="text" onClick={onClose} className="px-1" icon={<X />} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>Close</span>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
