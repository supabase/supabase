import { SupaColumn, SupaRow } from 'components/grid/types'
import { RenderCellProps } from 'react-data-grid'
import { NullValue } from '../common/NullValue'
import { EmptyValue } from '../common/EmptyValue'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export const DateTimeFormatter = (
  p: React.PropsWithChildren<RenderCellProps<SupaRow, unknown>> & { columnDef: SupaColumn }
) => {
  let value = p.row[p.column.key]
  if (value === null) return <NullValue />
  if (value === '') return <EmptyValue />

  const INPUT_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ'

  const OUTPUT_FORMAT = 'YYYY-MM-DD HH:mm:ss'

  if (p.columnDef.format.endsWith('z')) {
    return dayjs(value, INPUT_FORMAT).format(OUTPUT_FORMAT)
  } else {
    return value
  }
}
