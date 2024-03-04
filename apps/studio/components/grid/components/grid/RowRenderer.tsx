import type { Key } from 'react'
import { TriggerEvent, useContextMenu } from 'react-contexify'
import { Row, RenderRowProps } from 'react-data-grid'
import type { SupaRow } from '../../types'
import { ROW_CONTEXT_MENU_ID } from '../menu'

export default function RowRenderer(key: Key, props: RenderRowProps<SupaRow>) {
  const { show: showContextMenu } = useContextMenu()

  function displayMenu(e: TriggerEvent) {
    showContextMenu(e, {
      id: ROW_CONTEXT_MENU_ID,
      props: { rowIdx: props.rowIdx },
    })
  }

  return <Row key={key} {...props} onContextMenu={displayMenu} />
}
