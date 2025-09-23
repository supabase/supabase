'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import { cn } from '../../../lib/utils/cn'
import { buttonVariants } from './button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  // [Joshen] Wondering if this is a bug with react-day-picker v8 whereby a single selected date
  // has styles applied for both day_range_start and day_range_end. This might be fixed with the latest
  // version of react-day-picker, but in case we can opt for a pure tailwind solution instead of JS
  const fullDateRangeSelected =
    props.mode === 'range' && !!props.selected?.from && !!props.selected?.to

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-foreground-muted rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md',
          'last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_selected: 'bg-brand-500 text-foreground text-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'text-foreground-muted opacity-50',
        day_disabled: 'text-foreground-muted opacity-50',
        day_range_start: cn(fullDateRangeSelected && 'bg-brand-500 rounded-r-none'),
        day_range_middle: 'aria-selected:bg-brand-400 rounded-none',
        day_range_end: cn(fullDateRangeSelected && 'bg-brand-500 rounded-l-none'),
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
