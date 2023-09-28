import type { PostgresRole } from '@supabase/postgres-meta'

import MultiSelect from 'components/ui/MultiSelect'

interface PolicyRolesProps {
  roles: PostgresRole[]
  selectedRoles: string[]
  onUpdateSelectedRoles: (roles: string[]) => void
}

const PolicyRoles = ({ roles, selectedRoles, onUpdateSelectedRoles }: PolicyRolesProps) => {
  // @ts-ignore
  const formattedRoles = roles.map((role) => {
    return {
      id: role.id,
      name: role.name,
      value: role.name,
      disabled: false,
    }
  })

  return (
    <div className="flex space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-foreground-light text-base" htmlFor="policy-name">
          Target roles
        </label>
        <p className="text-foreground-lighter text-sm">Apply policy to the selected roles</p>
      </div>
      <div className="relative w-2/3">
        <MultiSelect
          options={formattedRoles}
          value={selectedRoles}
          placeholder="Defaults to all (public) roles if none selected"
          searchPlaceholder="Search for a role"
          onChange={onUpdateSelectedRoles}
        />
      </div>
    </div>
  )
}

export default PolicyRoles
