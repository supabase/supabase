import { FC } from 'react'
import type { PostgresRole } from '@supabase/postgres-meta'

import MultiSelect from 'components/ui/MultiSelect'

interface Props {
  roles: PostgresRole[]
  selectedRoles: string[]
  onUpdateSelectedRoles: (roles: string[]) => void
}

const PolicyRoles: FC<Props> = ({ roles, selectedRoles, onUpdateSelectedRoles }) => {
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
        <label className="text-scale-1100 text-base" htmlFor="policy-name">
          Target roles
        </label>
        <p className="text-scale-900 text-sm">Apply policy to the selected roles</p>
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
