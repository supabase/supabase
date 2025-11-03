import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { HTMLAttributes, useEffect, useState } from 'react'
import type { DateRange } from 'react-day-picker'

import {
  Button,
  Calendar,
  cn,
  Input,
  Label_Shadcn_ as Label,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverSeparator_Shadcn_ as PopoverSeparator,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectGroup_Shadcn_ as SelectGroup,
  SelectItem_Shadcn_ as SelectItem,
  SelectLabel_Shadcn_ as SelectLabel,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'
import { presets as defaultPresets } from './DataTable.constants'
import type { DatePreset, DateRangeDisabled } from './DataTable.types'
import { useDebounce } from './hooks/useDebounce'
import { kdbClassName } from './primitives/Kbd'

interface DatePickerWithRangeProps extends HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  presets?: DatePreset[]
  dateRangeDisabled?: DateRangeDisabled
}

// [Joshen] This might be better placed in ui instead of DataTable since it could be reusable
export function DatePickerWithRange({
  className,
  date,
  setDate,
  presets = defaultPresets,
  dateRangeDisabled,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!open) return

      presets.map((preset) => {
        if (preset.shortcut === e.key) {
          setDate({ from: preset.from, to: preset.to })
        }
      })
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setDate, presets, open])

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            type="outline"
            size="small"
            className={cn(
              'max-w-full justify-start truncate text-left font-normal hover:bg-muted/50',
              !date && 'text-muted-foreground'
            )}
            icon={<CalendarIcon className="mr-2 h-4 w-4" />}
          >
            {date?.from ? (
              date.to ? (
                <span className="truncate">
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </span>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" portal={true}>
          <div className="flex flex-col justify-between sm:flex-row">
            <div className="hidden sm:block">
              <DatePresets onSelect={setDate} selected={date} presets={presets} />
            </div>
            <div className="block p-3 sm:hidden">
              <DatePresetsSelect onSelect={setDate} selected={date} presets={presets} />
            </div>
            <PopoverSeparator className="h-auto w-px" />
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
              // @ts-ignore
              disabled={dateRangeDisabled}
            />
          </div>
          <PopoverSeparator />
          <CustomDateRange onSelect={setDate} selected={date} />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function DatePresets({
  selected,
  onSelect,
  presets,
}: {
  selected: DateRange | undefined
  onSelect: (date: DateRange | undefined) => void
  presets: DatePreset[]
}) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="mx-3 text-xs uppercase text-muted-foreground">Date Range</p>
      <div className="grid gap-1">
        {presets.map(({ label, shortcut, from, to }) => {
          const isActive = selected?.from === from && selected?.to === to
          return (
            <Button
              key={label}
              type={isActive ? 'secondary' : 'default'}
              size="small"
              onClick={() => onSelect({ from, to })}
              className="text-left"
            >
              <div className="flex items-center justify-between gap-6">
                <span className="mr-auto">{label}</span>
                <span className={cn(kdbClassName, 'uppercase')}>{shortcut}</span>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function DatePresetsSelect({
  selected,
  onSelect,
  presets,
}: {
  selected: DateRange | undefined
  onSelect: (date: DateRange | undefined) => void
  presets: DatePreset[]
}) {
  function findPreset(from?: Date, to?: Date) {
    return presets.find((p) => p.from === from && p.to === to)?.shortcut
  }
  const [value, setValue] = useState<string | undefined>(findPreset(selected?.from, selected?.to))

  useEffect(() => {
    const preset = findPreset(selected?.from, selected?.to)
    if (preset === value) return
    setValue(preset)
  }, [selected, presets])

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const preset = presets.find((p) => p.shortcut === v)
        if (preset) {
          onSelect({ from: preset.from, to: preset.to })
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Date Presets" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Date Presets</SelectLabel>
          {presets.map(({ label, shortcut }) => {
            return (
              <SelectItem
                key={label}
                value={shortcut}
                className="flex items-center justify-between [&>span:last-child]:flex [&>span:last-child]:w-full [&>span:last-child]:justify-between"
              >
                <span>{label}</span>
                <span className={cn(kdbClassName, 'ml-2 h-5 uppercase leading-snug')}>
                  {shortcut}
                </span>
              </SelectItem>
            )
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

// REMINDER: We can add min max date range validation https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local#setting_maximum_and_minimum_dates_and_times
function CustomDateRange({
  selected,
  onSelect,
}: {
  selected: DateRange | undefined
  onSelect: (date: DateRange | undefined) => void
}) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(selected?.from)
  const [dateTo, setDateTo] = useState<Date | undefined>(selected?.to)
  const debounceDateFrom = useDebounce(dateFrom, 1000)
  const debounceDateTo = useDebounce(dateTo, 1000)

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ''
    const utcDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return utcDate.toISOString().slice(0, 16)
  }

  useEffect(() => {
    onSelect({ from: debounceDateFrom, to: debounceDateTo })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceDateFrom, debounceDateTo])

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-xs uppercase text-muted-foreground">Custom Range</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="from">Start</Label>
          <Input
            key={formatDateForInput(selected?.from)}
            type="datetime-local"
            id="from"
            name="from"
            defaultValue={formatDateForInput(selected?.from)}
            onChange={(e) => {
              const newDate = new Date(e.target.value)
              if (!Number.isNaN(newDate.getTime())) {
                setDateFrom(newDate)
              }
            }}
            disabled={!selected?.from}
          />
        </div>
        <div className="grid w-full gap-1.5">
          <Label htmlFor="to">End</Label>
          <Input
            key={formatDateForInput(selected?.to)}
            type="datetime-local"
            id="to"
            name="to"
            defaultValue={formatDateForInput(selected?.to)}
            onChange={(e) => {
              const newDate = new Date(e.target.value)
              if (!Number.isNaN(newDate.getTime())) {
                setDateTo(newDate)
              }
            }}
            disabled={!selected?.to}
          />
        </div>
      </div>
    </div>
  )
}
