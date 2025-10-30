'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'

import { cn } from '../../../lib/utils/cn'
import { buttonVariants } from './button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const fullDateRangeSelected =
    props.mode === 'range' && !!props.selected?.from && !!props.selected?.to

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:[&>*:not(nav)+*]:ml-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'absolute left-5 top-4'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
          'absolute right-5 top-4'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-foreground-muted rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: cn(
          'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md',
          'last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20'
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        selected: 'bg-brand-500 text-foreground text-foreground',
        today: 'bg-accent text-accent-foreground',
        outside: 'text-foreground-muted opacity-50',
        disabled: 'text-foreground-muted opacity-50',
        range_start: cn(fullDateRangeSelected && 'bg-brand-500 rounded-r-none'),
        range_middle: 'aria-selected:bg-brand-400 rounded-none',
        range_end: cn(fullDateRangeSelected && 'bg-brand-500 rounded-l-none'),
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          const { className, ...rest } = props

          if (props.orientation === 'left') {
            return <ChevronLeft className={cn('h-4 w-4', className)} {...rest} />
          } else {
            return <ChevronRight className={cn('h-4 w-4', className)} {...rest} />
          }
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
