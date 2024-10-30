'use client'

import * as React from 'react'
import { addDays, format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from 'ui'
import { Calendar } from 'ui'
import { Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

export default function DatePickerWithPresets() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type={'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="flex w-auto flex-col space-y-2 p-2">
        <Select_Shadcn_ onValueChange={(value) => setDate(addDays(new Date(), parseInt(value)))}>
          <SelectTrigger_Shadcn_>
            <SelectValue_Shadcn_ placeholder="Select" />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_ position="popper">
            <SelectItem_Shadcn_ value="0">Today</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="1">Tomorrow</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="3">In 3 days</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="7">In a week</SelectItem_Shadcn_>
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
        <div className="rounded-md border">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
