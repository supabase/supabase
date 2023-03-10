import React, { useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { EditorProps } from '@supabase/react-data-grid'
import { Toggle, Button, IconX } from 'ui'

export function NullableBooleanEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  onRowChange,
  onClose,
}: EditorProps<TRow, TSummaryRow>) {
  const value = row[column.key as keyof TRow] as unknown as boolean | null

  useEffect(() => {
    // if value is null, set it to false on initial render
    if (value === null) {
      onRowChange({ ...row, [column.key]: false })
    }
  }, [])

  const onBlur = () => onClose(true)
  const onClear = () => onRowChange({ ...row, [column.key]: null }, true)
  const onChange = (value: boolean) => onRowChange({ ...row, [column.key]: value })

  return (
    <div className="sb-grid-checkbox-editor flex items-center">
      <Toggle
        // @ts-ignore
        onChange={onChange}
        onBlur={onBlur}
        checked={row[column.key as keyof TRow] as unknown as boolean}
        className="mx-auto translate-y-[1px]"
      />
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger className="flex items-center">
          <Button
            type="text"
            title="Set to NULL"
            icon={<IconX size="tiny" strokeWidth={2} />}
            className="px-1 mr-2"
            onClick={onClear}
          />
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-scale-100 py-1 px-2 leading-none shadow',
              'border border-scale-200',
            ].join(' ')}
          >
            <span className="text-xs text-scale-1200">Set to NULL</span>
          </div>
        </Tooltip.Content>
      </Tooltip.Root>
    </div>
  )
}
