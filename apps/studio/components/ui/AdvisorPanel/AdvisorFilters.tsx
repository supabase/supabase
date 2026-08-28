import { X } from 'lucide-react'

import { advisorCategoryLabels } from './AdvisorPanel.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FilterPopover } from '@/components/ui/FilterPopover'
import { AdvisorCategory, AdvisorSeverity } from '@/state/advisor-state'

const platformCategories: AdvisorCategory[] = ['security', 'performance', 'health', 'messages']
// Health runs against platform infrastructure and messages are platform notifications
const selfHostedCategories: AdvisorCategory[] = ['security', 'performance']

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
  categoryFilters: AdvisorCategory[]
  onCategoryFiltersChange: (filters: AdvisorCategory[]) => void
  severityFilters: AdvisorSeverity[]
  onSeverityFiltersChange: (filters: AdvisorSeverity[]) => void
  statusFilters: string[]
  onStatusFiltersChange: (filters: string[]) => void
  onClose: () => void
  isPlatform?: boolean
}

export const AdvisorFilters = ({
  categoryFilters,
  onCategoryFiltersChange,
  severityFilters,
  onSeverityFiltersChange,
  statusFilters,
  onStatusFiltersChange,
  onClose,
  isPlatform = false,
}: AdvisorFiltersProps) => {
  const categoryOptions = (isPlatform ? platformCategories : selfHostedCategories).map(
    (category) => ({ label: advisorCategoryLabels[category], value: category })
  )

  return (
    <div className="border-b overflow-x-auto">
      <div className="flex items-center justify-between gap-x-4 h-[calc(var(--header-height)-1px)]">
        <div className="flex items-center gap-x-2 pl-3">
          <FilterPopover
            name="Category"
            options={categoryOptions}
            activeOptions={[...categoryFilters]}
            valueKey="value"
            labelKey="label"
            isMinimized={true}
            onSaveFilters={(values) => {
              onCategoryFiltersChange(values as AdvisorCategory[])
            }}
          />
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
        </div>
        <ButtonTooltip
          variant="text"
          className="w-7 h-7 p-0 mr-3"
          icon={<X strokeWidth={1.5} />}
          onClick={onClose}
          tooltip={{ content: { side: 'bottom', text: 'Close Advisor Center' } }}
        />
      </div>
    </div>
  )
}
