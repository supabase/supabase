import { X } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { AdvisorSeverity, AdvisorTab } from 'state/advisor-state'
import { TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_ } from 'ui'

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
  hasProjectRef?: boolean
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
  hasProjectRef = true,
  onClose,
  isPlatform = false,
}: AdvisorFiltersProps) => {
  return (
    <div className="border-b">
      <div className="flex items-center justify-between gap-3 px-4 h-[46px]">
        <Tabs_Shadcn_ value={activeTab} onValueChange={onTabChange} className="h-full">
          <TabsList_Shadcn_ className="border-b-0 gap-4 h-full">
            <TabsTrigger_Shadcn_ value="all" className="h-full text-xs">
              All
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="security" className="h-full text-xs">
              Security
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ value="performance" className="h-full text-xs">
              Performance
            </TabsTrigger_Shadcn_>
            {isPlatform && (
              <TabsTrigger_Shadcn_
                value="messages"
                className="h-full text-xs flex items-center gap-2"
              >
                Messages
              </TabsTrigger_Shadcn_>
            )}
          </TabsList_Shadcn_>
        </Tabs_Shadcn_>
        <div className="flex items-center gap-2">
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
            type="text"
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
