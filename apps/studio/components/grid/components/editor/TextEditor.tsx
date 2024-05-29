import { PostgresTable } from '@supabase/postgres-meta'
import type { RenderEditCellProps } from 'react-data-grid'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useGetCellValueMutation } from 'data/table-rows/get-cell-value-mutation'
import { MAX_CHARACTERS } from 'data/table-rows/table-rows-query'
import { useSelectedProject } from 'hooks'
import useTable from 'hooks/misc/useTable'
import { Maximize } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  Button,
  Popover,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { TruncatedWarningOverlay } from '.'
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
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: selectedTable } = useTable(id)
  const project = useSelectedProject()

  const gridColumn = state.gridColumns.find((x) => x.name == column.key)
  const initialValue = row[column.key as keyof TRow] as unknown as string
  const [isPopoverOpen, setIsPopoverOpen] = useState(true)
  const [value, setValue] = useState<string | null>(initialValue)

  const { mutate: getCellValue, isLoading, isSuccess } = useGetCellValueMutation()

  const isTruncated =
    typeof initialValue === 'string' &&
    initialValue.endsWith('...') &&
    initialValue.length > MAX_CHARACTERS

  const loadFullValue = () => {
    if (selectedTable === undefined || project === undefined) return
    if ((selectedTable as PostgresTable).primary_keys.length === 0) {
      return toast('Unable to load value as table has no primary keys')
    }

    const pkMatch = (selectedTable as PostgresTable).primary_keys.reduce((a, b) => {
      return { ...a, [b.name]: (row as any)[b.name] }
    }, {})

    getCellValue(
      {
        table: { schema: selectedTable.schema, name: selectedTable.name },
        column: column.name as string,
        pkMatch,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
      },
      { onSuccess: (data) => setValue(data) }
    )
  }

  const cancelChanges = useCallback(() => {
    if (isEditable) onRowChange(row, true)
    setIsPopoverOpen(false)
  }, [])

  const saveChanges = useCallback(
    (newValue: string | null) => {
      if (isEditable && newValue !== value) {
        onRowChange({ ...row, [column.key]: newValue }, true)
      }
      setIsPopoverOpen(false)
    },
    [isSuccess]
  )

  const onSelectExpand = () => {
    cancelChanges()
    onExpandEditor(column.key, {
      ...row,
      [column.key]: value || (row as any)[column.key],
    })
  }

  const onChange = (_value: string | undefined) => {
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
        isTruncated && !isSuccess ? (
          <div
            style={{ width: `${gridColumn?.width || column.width}px` }}
            className="flex items-center justify-center flex-col relative"
          >
            <MonacoEditor
              readOnly
              onChange={() => {}}
              width={`${gridColumn?.width || column.width}px`}
              value={value ?? ''}
              language="markdown"
            />
            <TruncatedWarningOverlay isLoading={isLoading} loadFullValue={loadFullValue} />
          </div>
        ) : (
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
                  <Tooltip_Shadcn_>
                    <TooltipTrigger_Shadcn_ asChild>
                      <Button
                        type="default"
                        className="px-1"
                        onClick={() => onSelectExpand()}
                        icon={<Maximize size={12} strokeWidth={2} />}
                      />
                    </TooltipTrigger_Shadcn_>
                    <TooltipContent_Shadcn_ side="bottom">Expand editor</TooltipContent_Shadcn_>
                  </Tooltip_Shadcn_>
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
        )
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
