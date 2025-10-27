import { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import { SupaRow } from 'components/grid/types'
import { convertByteaToHex } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { NullValue } from '../common/NullValue'

export const BinaryFormatter = (p: PropsWithChildren<RenderCellProps<SupaRow, unknown>>) => {
  const value = p.row[p.column.key]
  if (!value) return <NullValue />
  const binaryValue = convertByteaToHex(value)
  return <>{binaryValue}</>
}
