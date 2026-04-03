import type { Key } from 'react'
import { RenderRowProps, Row } from 'react-data-grid'
import { ContextMenu_Shadcn_, ContextMenuTrigger_Shadcn_ } from 'ui'

import { RowContextMenuContent } from '../menu/RowContextMenu'
import { SupaRow } from '@/components/grid/types'

export function RowRenderer(key: Key, props: RenderRowProps<SupaRow>) {
  return (
    <ContextMenu_Shadcn_ modal={false} key={key}>
      <ContextMenuTrigger_Shadcn_ asChild>
        <Row {...props} />
      </ContextMenuTrigger_Shadcn_>
      <RowContextMenuContent row={props.row} />
    </ContextMenu_Shadcn_>
  )
}
