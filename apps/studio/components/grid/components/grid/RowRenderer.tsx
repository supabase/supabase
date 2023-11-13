import { Key } from 'react'
import { TriggerEvent, useContextMenu } from 'react-contexify'
import { Row, RenderRowProps } from 'react-data-grid'
import { MENU_IDS } from '../menu'
import { SupaRow } from '../../types'

export default function RowRenderer(key: Key, props: RenderRowProps<SupaRow>) {
  const { show: showContextMenu } = useContextMenu()

  function displayMenu(e: TriggerEvent) {
    const menuId = MENU_IDS.ROW_CONTEXT_MENU_ID
    showContextMenu(e, {
      id: menuId,
      props: { rowIdx: props.rowIdx },
    })
  }

  return <Row {...props} onContextMenu={displayMenu} />
}
