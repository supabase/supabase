'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

const ranges = ['Last hour', 'Last 24 hours', 'Last 7 days']

export default function ButtonDropdownDemo() {
  const [range, setRange] = useState('Last 24 hours')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" iconRight={<ChevronDown />} aria-label={`Time range: ${range}`}>
          {range}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={range} onValueChange={setRange}>
          {ranges.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
