import * as React from 'react'
import { RenderEditCellProps } from 'react-data-grid'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

function autoFocusAndSelect(input: HTMLInputElement | null) {
  input?.focus()
  input?.select()
}

interface TimeEditorProps<TRow, TSummaryRow = unknown>
  extends RenderEditCellProps<TRow, TSummaryRow> {
  format: string
}

/**
 * original input time format 'HH:mm'
 * when step=1, it becomes 'HH:mm:ss'
 */
const INPUT_TIME_FORMAT = 'HH:mm:ss'

function BaseEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  format,
  onRowChange,
  onClose,
}: TimeEditorProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as string
  const timeValue = value ? dayjs(value, format).format(INPUT_TIME_FORMAT) : value

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const _value = event.target.value
    if (_value == '') {
      onRowChange({ ...row, [column.key]: null })
    } else {
      const _timeValue = dayjs(_value, INPUT_TIME_FORMAT).format(format)
      onRowChange({ ...row, [column.key]: _timeValue })
    }
  }

  return (
    <input
      className="sb-grid-time-editor"
      ref={autoFocusAndSelect}
      value={timeValue ?? ''}
      onChange={onChange}
      onBlur={() => onClose(true)}
      type="time"
      step="1"
    />
  )
}

export function TimeEditor<TRow, TSummaryRow = unknown>(
  props: RenderEditCellProps<TRow, TSummaryRow>
) {
  return <BaseEditor {...props} format="HH:mm:ss" />
}

export function TimeWithTimezoneEditor<TRow, TSummaryRow = unknown>(
  props: RenderEditCellProps<TRow, TSummaryRow>
) {
  return <BaseEditor {...props} format="HH:mm:ssZZ" />
}
