import * as React from 'react'
import { FormatterProps } from '@supabase/react-data-grid'
import { SupaRow } from '../../types'
import { NullValue } from '../common'
import { ForeignTableModal } from '../common/ForeignTableModal'
import { useDispatch, useTrackedState } from '../../store'
import { deepClone } from '../../utils'

export const ForeignKeyFormatter = (
  p: React.PropsWithChildren<FormatterProps<SupaRow, unknown>>
) => {
  const state = useTrackedState()
  const dispatch = useDispatch()
  const value = p.row[p.column.key]

  function onRowChange(_value: any | null) {
    const rowData = deepClone(p.row)
    rowData[p.column.key] = _value

    const { error } = state.rowService!.update(rowData, p.row, p.column.key)
    if (error) {
      if (state.onError) state.onError(error)
    } else {
      dispatch({
        type: 'EDIT_ROW',
        payload: { row: rowData, idx: p.row.idx },
      })
    }
  }

  function onChange(_value: any | null) {
    onRowChange(_value)
  }

  return (
    <div className="sb-grid-foreign-key-formatter flex justify-between">
      <span className="sb-grid-foreign-key-formatter__text">
        {value === null ? <NullValue /> : value}
      </span>
      <ForeignTableModal columnName={p.column.key} defaultValue={value} onChange={onChange} />
    </div>
  )
}
