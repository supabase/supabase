import { FilterPopover } from 'components/ui/FilterPopover'

import { type RoleWithDescription, useRolesFilter } from '../hooks/useRolesFilter'
import { RoleTooltip } from './RoleTooltip'

interface RolesFilterDropdownProps {
  activeOptions: string[]
  onSaveFilters: (options: string[]) => void
  className?: string
}

export const RolesFilterDropdown = ({
  activeOptions,
  onSaveFilters,
  className,
}: RolesFilterDropdownProps) => {
  const { roles, roleGroups, isLoadingRoles } = useRolesFilter()

  const renderLabel = (option: RoleWithDescription, value: string) => (
    <RoleTooltip htmlFor={value} label={option.displayName} description={option.description} />
  )

  return (
    <FilterPopover
      name="Roles"
      options={roles}
      labelKey="displayName"
      valueKey="name"
      activeOptions={isLoadingRoles ? [] : activeOptions}
      onSaveFilters={onSaveFilters}
      className={className || 'w-60'}
      groups={roleGroups}
      renderLabel={renderLabel}
    />
  )
}
