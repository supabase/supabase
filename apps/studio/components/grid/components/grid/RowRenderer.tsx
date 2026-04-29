import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { Key, ReactNode } from 'react'
import { RenderRowProps, Row } from 'react-data-grid'
import { flushSync } from 'react-dom'
import { ContextMenu_Shadcn_, ContextMenuTrigger_Shadcn_ } from 'ui'

import { RowContextMenuContent } from '../menu/RowContextMenu'
import { SupaRow } from '@/components/grid/types'

type RowContextMenuContextValue = {
  onRowContextMenu: (e: React.MouseEvent, row: SupaRow) => void
}

const RowContextMenuContext = createContext<RowContextMenuContextValue | null>(null)

export function RowContextMenuProvider({ children }: { children: ReactNode }) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const [menuKey, setMenuKey] = useState(0)
  const [activeRow, setActiveRow] = useState<SupaRow | null>(null)

  const onRowContextMenu = useCallback((e: React.MouseEvent, row: SupaRow) => {
    e.preventDefault()
    flushSync(() => setActiveRow(row))
    setMenuKey((prev) => prev + 1)
    const trigger = triggerRef.current
    if (!trigger) return
    trigger.style.left = `${e.clientX}px`
    trigger.style.top = `${e.clientY}px`
    trigger.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: e.clientX,
        clientY: e.clientY,
      })
    )
  }, [])

  return (
    <RowContextMenuContext.Provider value={{ onRowContextMenu }}>
      <ContextMenu_Shadcn_ modal={false}>
        <ContextMenuTrigger_Shadcn_ asChild>
          <div ref={triggerRef} className="fixed pointer-events-none w-0 h-0" />
        </ContextMenuTrigger_Shadcn_>
        {activeRow && <RowContextMenuContent key={menuKey} row={activeRow} />}
      </ContextMenu_Shadcn_>
      {children}
    </RowContextMenuContext.Provider>
  )
}

function RowWithContextMenu({ row, ...props }: RenderRowProps<SupaRow>) {
  const ctx = useContext(RowContextMenuContext)

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      ctx?.onRowContextMenu(e, row)
    },
    [ctx, row]
  )

  return <Row row={row} {...props} onContextMenu={handleContextMenu} />
}

export function RowRenderer(key: Key, props: RenderRowProps<SupaRow>) {
  return <RowWithContextMenu key={key} {...props} />
}
