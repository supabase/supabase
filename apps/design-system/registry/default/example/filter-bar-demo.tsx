import { format } from 'date-fns'
import { useState } from 'react'
import { Button, Button_Shadcn_, Calendar, Input_Shadcn_ } from 'ui'
import { CustomOptionProps, FilterBar, FilterGroup } from 'ui-patterns'

function CustomDatePicker({ onChange, onCancel, search }: CustomOptionProps) {
  const [date, setDate] = useState<any | undefined>(
    search
      ? {
          from: new Date(search),
          to: undefined,
        }
      : undefined
  )

  return (
    <div className="w-[300px] space-y-4">
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date?.from}
        selected={date}
        onSelect={setDate}
        className="w-full"
      />
      <div className="flex justify-end gap-2 py-3 px-4 border-t">
        <Button type="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={() =>
            onChange(
              date?.from
                ? date.to
                  ? `${format(date.from, 'yyyy-MM-dd')} - ${format(date.to, 'yyyy-MM-dd')}`
                  : format(date.from, 'yyyy-MM-dd')
                : ''
            )
          }
        >
          Apply
        </Button>
      </div>
    </div>
  )
}

function CustomTimePicker({ onChange, onCancel, search }: CustomOptionProps) {
  const [time, setTime] = useState(search || '')

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Time</h3>
      <Input_Shadcn_ type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button_Shadcn_ variant="outline" onClick={onCancel}>
          Cancel
        </Button_Shadcn_>
        <Button_Shadcn_ onClick={() => onChange(time)}>Apply</Button_Shadcn_>
      </div>
    </div>
  )
}

function CustomRangePicker({ onChange, onCancel, search }: CustomOptionProps) {
  const [range, setRange] = useState(search || '')

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Select Range</h3>
      <Input_Shadcn_ type="range" value={range} onChange={(e) => setRange(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button_Shadcn_ variant="outline" onClick={onCancel}>
          Cancel
        </Button_Shadcn_>
        <Button_Shadcn_ onClick={() => onChange(range)}>Apply</Button_Shadcn_>
      </div>
    </div>
  )
}

const filterProperties = [
  {
    label: 'Name',
    name: 'name',
    type: 'string' as const,
    operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
  },
  {
    label: 'Status',
    name: 'status',
    type: 'string' as const,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
    ],
    operators: ['=', '!='],
  },
  {
    label: 'Type',
    name: 'type',
    type: 'string' as const,
    options: async (search?: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const allOptions = ['user', 'admin', 'guest']
      return search
        ? allOptions.filter((option) => option.toLowerCase().includes(search.toLowerCase()))
        : allOptions
    },
    operators: ['=', '!='],
  },
  {
    label: 'Time period',
    name: 'created_at',
    type: 'date' as const,
    options: [
      { label: 'Today', value: format(new Date(), 'yyyy-MM-dd') },
      { label: 'Yesterday', value: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') },
      { label: 'Last 7 days', value: format(new Date(Date.now() - 7 * 86400000), 'yyyy-MM-dd') },
      { label: 'Last 30 days', value: format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd') },
      {
        label: 'Pick a date...',
        component: (props: CustomOptionProps) => <CustomDatePicker {...props} />,
      },
    ],
    operators: ['=', '!=', '>', '<', '>=', '<='],
  },
  {
    label: 'Priority',
    name: 'priority',
    type: 'number' as const,
    options: {
      component: (props: CustomOptionProps) => (
        <div className="p-6">
          <Button onClick={() => props.onChange('1')}>Custom value</Button>
        </div>
      ),
    },
    triggerOnPropertyClick: true,
    operators: ['=', '!=', '>', '<', '>=', '<='],
  },
]

const initialFilters: FilterGroup = {
  logicalOperator: 'AND',
  conditions: [],
}

export default function FilterBarDemo() {
  const [filters, setFilters] = useState<FilterGroup>(initialFilters)
  const [freeformText, setFreeformText] = useState('')

  return (
    <div className="w-full">
      <FilterBar
        filterProperties={filterProperties}
        freeformText={freeformText}
        onFreeformTextChange={setFreeformText}
        filters={filters}
        onFilterChange={setFilters}
      />
    </div>
  )
}
