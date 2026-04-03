import type { Key } from 'react'
import { useRef, useState } from 'react'
import { RenderRowProps, Row } from 'react-data-grid'
import { ContextMenu_Shadcn_, ContextMenuTrigger_Shadcn_ } from 'ui'

import { RowContextMenuContent } from '../menu/RowContextMenu'
import { SupaRow } from '@/components/grid/types'

function RowWithContextMenu({ row, ...props }: RenderRowProps<SupaRow>) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [menuKey, setMenuKey] = useState(0)

  // Hack to make ContextMenu work with react-data-grid, which doesn't support portals in rows. The original bug
  // was that the ContextMenu didn't move when right-clicking two cells in the same row
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    const trigger = triggerRef.current
    if (!trigger) return
    setMenuKey((k) => k + 1)
    trigger.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
      })
    )
  }

  return (
    <ContextMenu_Shadcn_ modal={false}>
      <ContextMenuTrigger_Shadcn_ ref={triggerRef} />
      <RowContextMenuContent key={menuKey} row={row} />
      <Row row={row} {...props} onContextMenu={handleContextMenu} />
    </ContextMenu_Shadcn_>
  )
}

export function RowRenderer(key: Key, props: RenderRowProps<SupaRow>) {
  return <RowWithContextMenu key={key} {...props} />
}
