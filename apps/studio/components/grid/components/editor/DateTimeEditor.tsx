import dayjs from 'dayjs'
import { useEffect, useRef, type ChangeEvent } from 'react'
import type { RenderEditCellProps } from 'react-data-grid'

interface BaseEditorProps<TRow, TSummaryRow = unknown>
  extends RenderEditCellProps<TRow, TSummaryRow> {
  format: string
}

function BaseEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  format,
  onRowChange,
  onClose,
}: BaseEditorProps<TRow, TSummaryRow>) {
  const ref = useRef<HTMLInputElement>(null)
  const value = row[column.key as keyof TRow] as unknown as string
  const timeValue = value ? dayjs(value, format).format('YYYY-MM-DDTHH:mm:ss') : value

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const _value = event.target.value
    if (_value.length === 0) {
      onRowChange({ ...row, [column.key]: null })
    } else {
      const _timeValue = dayjs(_value).format(format)
      onRowChange({ ...row, [column.key]: _timeValue })
    }
  }

  useEffect(() => {
    if (ref.current) {
      ref.current.focus()
      ref.current.showPicker()
    }
  }, [])

  return (
    <input
      ref={ref}
      step="1"
      type="datetime-local"
      className="h-full w-full px-2 text-sm"
      value={timeValue ?? ''}
      onChange={onChange}
      onBlur={() => onClose(true)}
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
