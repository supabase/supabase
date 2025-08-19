import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'

import { TimeSplitInput } from 'components/ui/DatePicker/TimeSplitInput'
import {
  Button,
  ButtonProps,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

export type TokenDatePickerValue = {
  date: string
}

interface TokensDatePickerProps {
  value: TokenDatePickerValue
  buttonTriggerProps?: ButtonProps
  popoverContentProps?: typeof PopoverContent_Shadcn_
  onSubmit: (value: TokenDatePickerValue) => void
  disabled?: (date: Date) => boolean
}

export const TokensDatePicker = ({
  value,
  buttonTriggerProps,
  popoverContentProps,
  onSubmit,
  disabled,
}: PropsWithChildren<TokensDatePickerProps>) => {
  const [open, setOpen] = useState(false)
  const todayButtonRef = useRef<HTMLButtonElement>(null)
  const timeInputRef = useRef<HTMLDivElement>(null)

  // Reset the state when the popover closes
  useEffect(() => {
    if (!open) {
      const dateToSet = value.date ? new Date(value.date) : new Date()
      setSelectedDate(dateToSet)

      // If there's an existing value, use its time, otherwise default to 23:59:59
      if (value.date) {
        setSelectedTime({
          HH: dateToSet.getHours().toString().padStart(2, '0'),
          mm: dateToSet.getMinutes().toString().padStart(2, '0'),
          ss: dateToSet.getSeconds().toString().padStart(2, '0'),
        })
      } else {
        setSelectedTime({
          HH: '23',
          mm: '59',
          ss: '59',
        })
      }
    }
  }, [open, value.date])

  // Focus the time input when popover opens
  useEffect(() => {
    if (open && timeInputRef.current) {
      // Small delay to ensure the popover is fully rendered
      setTimeout(() => {
        const firstInput = timeInputRef.current?.querySelector('input')
        if (firstInput) {
          firstInput.focus()
        }
      }, 100)
    }
  }, [open])

  // Prevent parent dialog from stealing focus when popover is open
  useEffect(() => {
    if (open) {
      const handleFocusIn = (event: FocusEvent) => {
        const target = event.target as HTMLElement
        const popover = timeInputRef.current?.closest('[data-radix-popper-content-wrapper]')

        // If focus is moving outside the popover, prevent it
        if (popover && !popover.contains(target)) {
          event.preventDefault()
          event.stopPropagation()

          // Refocus the first time input
          const firstInput = timeInputRef.current?.querySelector('input')
          if (firstInput) {
            firstInput.focus()
          }
        }
      }

      document.addEventListener('focusin', handleFocusIn, true)

      return () => {
        document.removeEventListener('focusin', handleFocusIn, true)
      }
    }
  }, [open])

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value.date ? new Date(value.date) : new Date()
  )
  const [selectedTime, setSelectedTime] = useState(() => {
    if (value.date) {
      const date = new Date(value.date)
      return {
        HH: date.getHours().toString().padStart(2, '0'),
        mm: date.getMinutes().toString().padStart(2, '0'),
        ss: date.getSeconds().toString().padStart(2, '0'),
      }
    }
    return {
      HH: '23',
      mm: '59',
      ss: '59',
    }
  })

  function handleDatePickerChange(date: Date | null) {
    setSelectedDate(date)
  }

  function handleApply() {
    if (!selectedDate) return

    // Add Time to the date
    const finalDate = new Date(
      selectedDate.setHours(+selectedTime.HH, +selectedTime.mm, +selectedTime.ss)
    )

    onSubmit({
      date: finalDate.toISOString(),
    })

    setOpen(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" icon={<Clock />} {...buttonTriggerProps}>
          {selectedDate ? `${dayjs(selectedDate).format('DD MMM, HH:mm')}` : 'Select date'}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="flex w-auto p-0 z-50"
        side="bottom"
        align="end"
        portal={true}
        {...popoverContentProps}
      >
        <div>
          <div className="flex p-2 gap-2 items-center">
            <div ref={timeInputRef} className="flex flex-grow *:flex-grow gap-2 font-mono">
              <TimeSplitInput
                type="start"
                startTime={selectedTime}
                endTime={selectedTime}
                time={selectedTime}
                setTime={setSelectedTime}
                setStartTime={setSelectedTime}
                setEndTime={setSelectedTime}
                startDate={selectedDate}
                endDate={selectedDate}
              />
            </div>
          </div>
          <div className="p-2 border-t">
            <DatePicker
              inline
              selected={selectedDate}
              onChange={handleDatePickerChange}
              dateFormat="MMMM d, yyyy h:mm aa"
              dayClassName={() => 'cursor-pointer hover:bg-accent'}
              filterDate={(date) => {
                if (!disabled) return true
                return !disabled(date)
              }}
              todayButton={
                <div className="sr-only">
                  <Button type="text" size="tiny" ref={todayButtonRef}>
                    Go to today
                  </Button>
                </div>
              }
              renderCustomHeader={({
                date,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="flex items-center justify-between">
                  <div className="flex w-full items-center justify-between">
                    <Button
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      icon={<ChevronLeft size={14} strokeWidth={2} />}
                      type="text"
                      size="tiny"
                      className="px-1.5"
                    />
                    <span className="text-sm text-foreground-light">
                      {dayjs(date).format('MMMM YYYY')}
                    </span>
                    <Button
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      icon={<ChevronRight size={14} strokeWidth={2} />}
                      type="text"
                      size="tiny"
                      className="px-1.5"
                    />
                  </div>
                </div>
              )}
            />
          </div>
          <div className="flex items-center justify-end gap-2 p-2 border-t">
            <Button
              type="default"
              onClick={() => {
                if (todayButtonRef.current) {
                  todayButtonRef.current.click()
                }
                setSelectedDate(new Date())
              }}
            >
              Today
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
