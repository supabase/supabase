'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '../../../lib/utils/cn'
import { buttonVariants } from './button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const fullDateRangeSelected =
    props.mode === 'range' && !!props.selected?.from && !!props.selected?.to

  const {
    months,
    month,
    month_caption,
    caption_label,
    button_previous,
    button_next,
    month_grid,
    weekdays,
    weekday,
    week,
    day,
    day_button,
    selected,
    today,
    outside,
    disabled,
    range_start,
    range_middle,
    range_end,
    hidden,
    ...restClassNames
  } = classNames ?? {}

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: cn(
          'relative flex flex-col sm:flex-row space-y-4 sm:[&>*:not(nav)+*]:ml-4 sm:space-y-0',
          months
        ),
        month: cn('space-y-4', month),
        month_caption: cn('flex justify-center pt-1 relative items-center', month_caption),
        caption_label: cn('text-sm font-medium', caption_label),
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'z-[5]',
          'aria-disabled:opacity-25 aria-disabled:hover:opacity-25 aria-disabled:cursor-not-allowed',
          'absolute left-0 top-0',
          button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'z-[5]',
          'aria-disabled:opacity-25 aria-disabled:hover:opacity-25 aria-disabled:cursor-not-allowed',
          'absolute right-0 top-0',
          button_next
        ),
        month_grid: cn('w-full border-collapse space-y-1', month_grid),
        weekdays: cn('flex', weekdays),
        weekday: cn('text-foreground-muted rounded-md w-9 font-normal text-[0.8rem]', weekday),
        week: cn('flex w-full mt-2', week),
        day: cn(
          'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md',
          'last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
          day
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
          day_button
        ),
        selected: cn('bg-brand-500 text-foreground text-foreground', selected),
        today: cn('bg-accent text-accent-foreground', today),
        outside: cn('text-foreground-muted opacity-50', outside),
        disabled: cn('text-foreground-muted opacity-50', disabled),
        range_start: cn(fullDateRangeSelected && 'bg-brand-500 rounded-r-none', range_start),
        range_middle: cn('aria-selected:bg-brand-400 rounded-none', range_middle),
        range_end: cn(fullDateRangeSelected && 'bg-brand-500 rounded-l-none', range_end),
        hidden: cn('invisible', hidden),
        ...restClassNames,
      }}
      components={{
        Chevron: (props) => {
          const { className, ...rest } = props

          if (props.orientation === 'left') {
            return (
              <ChevronLeft className={cn('h-4 w-4 pointer-events-none', className)} {...rest} />
            )
          } else {
            return (
              <ChevronRight className={cn('h-4 w-4 pointer-events-none', className)} {...rest} />
            )
          }
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
