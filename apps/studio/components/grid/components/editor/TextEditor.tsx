import { PostgresTable } from '@supabase/postgres-meta'
import { Maximize } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { RenderEditCellProps } from 'react-data-grid'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useGetCellValueMutation } from 'data/table-rows/get-cell-value-mutation'
import { MAX_CHARACTERS } from 'data/table-rows/table-rows-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import useTable from 'hooks/misc/useTable'
import {
  Button,
  Popover,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { useTrackedState } from '../../store/Store'
import { BlockKeys } from '../common/BlockKeys'
import { EmptyValue } from '../common/EmptyValue'
import { MonacoEditor } from '../common/MonacoEditor'
import { NullValue } from '../common/NullValue'
import { TruncatedWarningOverlay } from './TruncatedWarningOverlay'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

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
  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)

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
    <>
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
            <BlockKeys
              value={value}
              onEscape={cancelChanges}
              onEnter={saveChanges}
              ignoreOutsideClicks={isConfirmNextModalOpen}
            >
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
                        size="tiny"
                        type="default"
                        htmlType="button"
                        onClick={() => setIsConfirmNextModalOpen(true)}
                      >
                        Set to NULL
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
      <ConfirmationModal
        visible={isConfirmNextModalOpen}
        title="Confirm setting value to NULL"
        confirmLabel="Confirm"
        onCancel={() => setIsConfirmNextModalOpen(false)}
        onConfirm={() => {
          saveChanges(null)
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you wish to set this value to NULL? This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
