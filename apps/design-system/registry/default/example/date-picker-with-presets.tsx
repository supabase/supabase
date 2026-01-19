'use client'

import { addDays, format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

export default function DatePickerWithPresets() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type={'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
          icon={<CalendarIcon className="h-4 w-4" />}
        >
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
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
      </PopoverContent>
    </Popover>
  )
}
