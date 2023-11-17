import { ChangeEvent } from 'react'
import { RenderEditCellProps } from 'react-data-grid'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

function autoFocusAndSelect(input: HTMLInputElement | null) {
  input?.focus()
  input?.select()
}

interface Props<TRow, TSummaryRow = unknown> extends RenderEditCellProps<TRow, TSummaryRow> {
  format: string
}

const INPUT_DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss'

function BaseEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  format,
  onRowChange,
  onClose,
}: Props<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as string
  const timeValue = value ? dayjs(value, format).format(INPUT_DATE_TIME_FORMAT) : value

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const _value = event.target.value
    if (_value.length === 0) {
      onRowChange({ ...row, [column.key]: null })
    } else {
      const _timeValue = dayjs(_value).format(format)
      onRowChange({ ...row, [column.key]: _timeValue })
    }
  }

  return (
    <input
      className="sb-grid-datetime-editor"
      ref={autoFocusAndSelect}
      value={timeValue ?? ''}
      onChange={onChange}
      onBlur={() => onClose(true)}
      type="datetime-local"
      step="1"
    />
  )
}

export function DateTimeEditor<TRow, TSummaryRow = unknown>(
  props: RenderEditCellProps<TRow, TSummaryRow>
) {
  return <BaseEditor {...props} format="YYYY-MM-DDTHH:mm:ss" />
}

export function DateTimeWithTimezoneEditor<TRow, TSummaryRow = unknown>(
  props: RenderEditCellProps<TRow, TSummaryRow>
) {
  return <BaseEditor {...props} format="YYYY-MM-DDTHH:mm:ssZ" />
}
