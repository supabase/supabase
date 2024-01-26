import * as Tooltip from '@radix-ui/react-tooltip'
import { useCallback, useState } from 'react'
import { RenderEditCellProps } from 'react-data-grid'
import { Button, IconMaximize, Popover } from 'ui'
import { useTrackedState } from '../../store'
import { BlockKeys, EmptyValue, MonacoEditor, NullValue } from '../common'

export const TextEditor = <TRow, TSummaryRow = unknown>({
  row,
  column,
  isNullable,
  isEditable,
  onRowChange,
  onExpandEditor,
}: RenderEditCellProps<TRow, TSummaryRow> & {
  isNullable?: boolean
  isEditable?: boolean
  onExpandEditor: (column: string, row: TRow) => void
}) => {
  const state = useTrackedState()
  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const gridColumn = state.gridColumns.find((x) => x.name == column.key)
  const initialValue = row[column.key as keyof TRow] as unknown as string
  const [value, setValue] = useState<string | null>(initialValue)

  const cancelChanges = useCallback(() => {
    if (isEditable) onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback((newValue: string | null) => {
    if (isEditable) onRowChange({ ...row, [column.key]: newValue }, true)
    setIsPopoverOpen(false)
  }, [])

  const onSelectExpand = () => {
    cancelChanges()
    onExpandEditor(column.key, {
      ...row,
      [column.key]: value || (row as any)[column.key],
    })
  }

  function onChange(_value: string | undefined) {
    if (!isEditable) return

    if (!_value) setValue('')
    else setValue(_value)
  }

  return (
    <Popover
      open={isPopoverOpen}
      side="bottom"
      align="start"
      sideOffset={-35}
      className="rounded-none"
      overlay={
        <BlockKeys value={value} onEscape={cancelChanges} onEnter={saveChanges}>
          <MonacoEditor
            width={`${gridColumn?.width || column.width}px`}
            value={value ?? ''}
            readOnly={!isEditable}
            onChange={onChange}
          />
          {isEditable && (
            <div className="flex items-start justify-between p-2 bg-surface-200 space-x-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="px-1.5 py-[2.5px] rounded bg-surface-300 border border-strong flex items-center justify-center">
                    <span className="text-[10px]">⏎</span>
                  </div>
                  <p className="text-xs text-foreground-light">Save changes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-1 py-[2.5px] rounded bg-surface-300 border border-strong flex items-center justify-center">
                    <span className="text-[10px]">Esc</span>
                  </div>
                  <p className="text-xs text-foreground-light">Cancel changes</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-y-1">
                <div>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <Button
                        type="default"
                        className="px-1"
                        onClick={() => onSelectExpand()}
                        icon={<IconMaximize size={12} strokeWidth={2} />}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="bottom">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'rounded bg-alternative py-1 px-2 leading-none shadow',
                            'border border-background',
                          ].join(' ')}
                        >
                          <span className="text-xs text-foreground">Expand editor</span>
                        </div>
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
                {isNullable && (
                  <Button
                    asChild
                    htmlType="button"
                    type="default"
                    size="tiny"
                    onClick={() => saveChanges(null)}
                  >
                    <div>Set to NULL</div>
                  </Button>
                )}
              </div>
            </div>
          )}
        </BlockKeys>
      }
    >
      <div
        className={`${
          !!value && value.trim().length == 0 ? 'sb-grid-fill-container' : ''
        } sb-grid-text-editor__trigger`}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      >
        {value === null ? <NullValue /> : value === '' ? <EmptyValue /> : value}
      </div>
    </Popover>
  )
}
