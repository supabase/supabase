import { FilterPopover } from '@/components/ui/FilterPopover'

interface SourceFilterDropdownProps {
  activeOptions: string[]
  onSaveFilters: (options: string[]) => void
  className?: string
}

const sources = [
  {
    name: 'dashboard',
    displayName: 'Dashboard',
  },
  {
    name: 'non-dashboard',
    displayName: 'Non-dashboard',
  },
]

export const SourceFilterDropdown = ({
  activeOptions,
  onSaveFilters,
  className,
}: SourceFilterDropdownProps) => {
  return (
    <FilterPopover
      name="Source"
      options={sources}
      valueKey="name"
      labelKey="displayName"
      activeOptions={activeOptions}
      onSaveFilters={onSaveFilters}
      className={className || 'w-60'}
    />
  )
}
