import { FC } from 'react'
import { PostgresRole } from '@supabase/postgres-meta'

import MultiSelectUI from 'components/ui/MultiSelect'

interface Props {
  roles: PostgresRole[]
  selectedRoles: PostgresRole[]
  onUpdateSelectedRoles: (roles: PostgresRole[]) => void
}

const PolicyRoles: FC<Props> = ({ roles, selectedRoles, onUpdateSelectedRoles }) => {
  // @ts-ignore
  const formattedRoles = roles.map((role) => {
    return {
      id: role.id.toString(),
      name: role.name,
      value: role.name,
      disabled: false,
    }
  })

  return (
    <div className="flex space-x-12">
      <div className="flex w-1/3 flex-col space-y-2">
        <label className="text-scale-1100 text-base" htmlFor="policy-name">
          Roles
        </label>
        <p className="text-scale-900 text-sm">Apply policy to the specified roles</p>
      </div>
      <div className="relative w-2/3">
        <MultiSelectUI
          options={formattedRoles}
          value={selectedRoles.map((role) => role.name)}
          searchPlaceholder="Search for a role"
          onChange={(updatedRoles) => {
            const selectedRoles = roles.filter((role) => updatedRoles.includes(role.name))
            onUpdateSelectedRoles(selectedRoles)
          }}
        />
      </div>
    </div>
  )
}

export default PolicyRoles
