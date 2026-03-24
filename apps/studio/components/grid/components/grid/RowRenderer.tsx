import { REFERENCE_PEEK_CONTEXT_MENU_ID, ROW_CONTEXT_MENU_ID } from 'components/grid/constants'
import type { Key } from 'react'
import { TriggerEvent, useContextMenu } from 'react-contexify'
import { RenderRowProps, Row } from 'react-data-grid'

function createRowRenderer(menuId: string) {
  return function CustomRowRenderer<TRow>(key: Key, props: RenderRowProps<TRow>) {
    const { show: showContextMenu } = useContextMenu()

    function displayMenu(e: TriggerEvent) {
      showContextMenu(e, {
        id: menuId,
        props: { rowIdx: props.rowIdx },
      })
    }

    return <Row key={key} {...props} onContextMenu={displayMenu} />
  }
}

export const RowRenderer = createRowRenderer(ROW_CONTEXT_MENU_ID)
export const PeekRowRenderer = createRowRenderer(REFERENCE_PEEK_CONTEXT_MENU_ID)
