import { ChevronDown } from 'lucide-react'

import { Button, cn } from 'ui'
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import {
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
} from 'ui'

const MODES = [
  {
    key: 'default',
    label: 'Default mode',
    description: 'Shows all metrics',
  },
  {
    key: 'debug',
    label: 'Debug mode',
    description: 'Shows error metrics',
  },
  {
    key: 'usage',
    label: 'Usage mode',
    description: 'Shows growth metrics',
  },
] as const

type ReportMode = (typeof MODES)[number]['key']

interface ReportModeSelectorProps {
  value: ReportMode
  onChange: (value: ReportMode) => void
}

export const useReportModeState = () => {
  const [value, setValue] = useQueryState(
    'mode',
    parseAsStringLiteral(['default', 'debug', 'usage']).withDefault('default')
  )

  return { value, setValue }
}

export const ReportModeSelector = ({ value, onChange }: ReportModeSelectorProps) => {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className={cn('w-18 h-[26px] font-mono text-xs')}>
        {MODES.find((m) => m.key === value)?.label}
      </SelectTrigger>
      <SelectContent align="start" className="p-0 w-72">
        {MODES.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            <div className="flex flex-col text-xs">
              <div>{option.label}</div>
              <div className="text-foreground-lighter">{option.description}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
