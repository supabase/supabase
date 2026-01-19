import dayjs from 'dayjs'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { RenderEditCellProps } from 'react-data-grid'

import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'
import { TimestampInfo, timestampLocalFormatter } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { BlockKeys } from '../common/BlockKeys'

interface BaseEditorProps<TRow, TSummaryRow = unknown>
  extends RenderEditCellProps<TRow, TSummaryRow> {
  type: 'date' | 'datetime' | 'datetimetz'
  isNullable: boolean
}

const FORMAT_MAP = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  datetimetz: 'YYYY-MM-DD HH:mm:ss+ZZ',
}

function BaseEditor<TRow, TSummaryRow = unknown>({
  row,
  column,
  type,
  isNullable,
  onRowChange,
  onClose,
}: BaseEditorProps<TRow, TSummaryRow>) {
  const ref = useRef<HTMLInputElement>(null)
  const format = FORMAT_MAP[type]

  const value = row[column.key as keyof TRow] as unknown as string
  const [inputValue, setInputValue] = useState(value)
  const timeValue = inputValue ? Number(dayjs(inputValue, format)) : inputValue

  const saveChanges = (value: string | null) => {
    if ((typeof value === 'string' && value.length === 0) || timeValue === 'Invalid Date') return
    onRowChange({ ...row, [column.key]: value }, true)
  }

  const setToNow = () => {
    const formattedNow = dayjs().format(
      type === 'date'
        ? 'YYYY-MM-DD'
        : type === 'datetimetz'
          ? 'YYYY-MM-DDTHH:mm:ssZ'
          : 'YYYY-MM-DDTHH:mm:ss'
    )
    saveChanges(formattedNow)
  }

  useEffect(() => {
    try {
      ref.current?.focus({ preventScroll: true })
    } catch (e) {
      ref.current?.focus()
    }
  }, [])

  return (
    <Popover open>
      <PopoverTrigger>
        <div className={cn('px-[8px]', value === null ? 'text-foreground-lighter' : '')}>
          {value === null ? 'NULL' : value}
        </div>
      </PopoverTrigger>
      <PopoverContent portal align="start" className="p-0 rounded-none w-64">

        <BlockKeys
          ignoreOutsideClicks
          value={inputValue}
          onEscape={() => onClose(false)}
          onEnter={saveChanges}
        >
          <Input
            ref={ref}
            value={inputValue ?? ''}
            placeholder={format}
            onChange={(e) => setInputValue(e.target.value)}
            className="border-0 rounded-none bg-dash-sidebar outline-none !ring-0 !ring-offset-0"
          />
        </BlockKeys>
        <div className="px-3 py-1 flex flex-col gap-y-0.5">
          <p className="text-xs text-foreground-lighter">Formatted value:</p>
          {(inputValue ?? '').length === 0 ? (
            <p className="text-sm font-mono text-foreground-light">Enter a valid date format</p>
          ) : timeValue === 'Invalid Date' ? (
            <p className="text-sm font-mono text-foreground-light">Invalid date format</p>
          ) : type === 'datetimetz' ? (
            <TimestampInfo
              displayAs="utc"
              utcTimestamp={timeValue}
              labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
              className="text-left !text-sm font-mono tracking-tight"
            />
          ) : (
            <p className="text-sm font-mono tracking-tight">
              {timestampLocalFormatter({
                utcTimestamp: timeValue,
                format:
                  type === 'date'
                    ? 'DD MMM YYYY'
                    : type === 'datetime'
                      ? 'DD MMM YYYY HH:mm:ss'
                      : undefined,
              })}
            </p>
          )}
        </div>
        <div className="px-3 pt-1 pb-2 flex justify-between gap-x-1">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="px-1.5 h-[22px] rounded bg-surface-300 border border-strong flex items-center justify-center">
                <span className="text-[10px]">⏎</span>
              </div>
              <p className="text-xs text-foreground-light">Save changes</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-1 h-[22px] rounded bg-surface-300 border border-strong flex items-center justify-center">
                <span className="text-[10px]">Esc</span>
              </div>
              <p className="text-xs text-foreground-light">Cancel changes</p>
            </div>
          </div>
          <div className="flex">
            {isNullable ? (
              <>
                <Button type="default" className="rounded-r-none" onClick={() => saveChanges(null)}>
                  Set NULL
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="default"
                      icon={<ChevronDown />}
                      className="px-1 rounded-l-none border-l-0"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-20" align="end">
                    <DropdownMenuItem onClick={setToNow}>Set to NOW</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button type="default" onClick={setToNow}>
                Set to NOW
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function DateTimeEditor(type: 'datetime' | 'datetimetz' | 'date', isNullable: boolean) {
  // eslint-disable-next-line react/display-name
  return <TRow, TSummaryRow = unknown>(props: RenderEditCellProps<TRow, TSummaryRow>) => {
    return <BaseEditor {...props} type={type} isNullable={isNullable} />
  }
}
