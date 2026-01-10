import { FilterPopover } from 'components/ui/FilterPopover'

interface IndexAdvisorFilterProps {
  activeOptions: string[]
  onSaveFilters: (options: string[]) => void
  className?: string
}

const indexAdvisorOptions = [{ value: 'true', label: 'Index Advisor' }]

export const IndexAdvisorFilter = ({
  activeOptions,
  onSaveFilters,
  className,
}: IndexAdvisorFilterProps) => {
  return (
    <FilterPopover
      name="Warnings"
      options={indexAdvisorOptions}
      labelKey="label"
      valueKey="value"
      activeOptions={activeOptions}
      onSaveFilters={onSaveFilters}
      className={className || 'w-56'}
    />
  )
}
