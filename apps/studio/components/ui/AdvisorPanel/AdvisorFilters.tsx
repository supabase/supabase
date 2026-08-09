import { X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FilterPopover } from '@/components/ui/FilterPopover'
import { AdvisorSeverity, AdvisorTab } from '@/state/advisor-state'

const severityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'Warning', value: 'warning' },
  { label: 'Info', value: 'info' },
]

const statusOptions = [
  { label: 'Unread', value: 'unread' },
  { label: 'Archived', value: 'archived' },
]

interface AdvisorFiltersProps {
  activeTab: AdvisorTab
  onTabChange: (tab: string) => void
  severityFilters: AdvisorSeverity[]
  onSeverityFiltersChange: (filters: AdvisorSeverity[]) => void
  statusFilters: string[]
  onStatusFiltersChange: (filters: string[]) => void
  onClose: () => void
  isPlatform?: boolean
}

export const AdvisorFilters = ({
  activeTab,
  onTabChange,
  severityFilters,
  onSeverityFiltersChange,
  statusFilters,
  onStatusFiltersChange,
  onClose,
  isPlatform = false,
}: AdvisorFiltersProps) => {
  return (
    <div className="border-b overflow-x-auto">
      <div className="flex items-center justify-between gap-x-4 h-[calc(var(--header-height)-1px)]">
        <Tabs value={activeTab} onValueChange={onTabChange} className="h-full pl-4">
          <TabsList className="border-b-0 gap-4 h-full">
            <TabsTrigger value="all" className="h-full text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="security" className="h-full text-xs">
              Security
            </TabsTrigger>
            <TabsTrigger value="performance" className="h-full text-xs">
              Performance
            </TabsTrigger>
            {isPlatform && (
              <TabsTrigger value="messages" className="h-full text-xs flex items-center gap-2">
                Messages
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-x-2 pr-3">
          {isPlatform && (
            <FilterPopover
              name="Status"
              options={statusOptions}
              activeOptions={[...statusFilters]}
              valueKey="value"
              labelKey="label"
              isMinimized={true}
              onSaveFilters={onStatusFiltersChange}
            />
          )}
          <FilterPopover
            name="Severity"
            options={severityOptions}
            activeOptions={[...severityFilters]}
            valueKey="value"
            labelKey="label"
            isMinimized={true}
            onSaveFilters={(values) => {
              onSeverityFiltersChange(values as AdvisorSeverity[])
            }}
          />
          <ButtonTooltip
            variant="text"
            className="w-7 h-7 p-0"
            icon={<X strokeWidth={1.5} />}
            onClick={onClose}
            tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
          />
        </div>
      </div>
    </div>
  )
}
