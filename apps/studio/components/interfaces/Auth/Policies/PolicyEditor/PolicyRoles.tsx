import { sortBy } from 'lodash'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { SYSTEM_ROLES } from '@/components/interfaces/Database/Roles/Roles.constants'
import AlertError from '@/components/ui/AlertError'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface PolicyRolesProps {
  selectedRoles: string[]
  onUpdateSelectedRoles: (roles: string[]) => void
}
type SystemRole = (typeof SYSTEM_ROLES)[number]

export const PolicyRoles = ({ selectedRoles, onUpdateSelectedRoles }: PolicyRolesProps) => {
  const { data: project } = useSelectedProjectQuery()
  const {
    data,
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = sortBy(
    (data ?? []).filter((role) => !SYSTEM_ROLES.includes(role.name as SystemRole)),
    (r) => r.name.toLocaleLowerCase()
  )

  const formattedRoles = roles.map((role) => {
    return {
      id: role.id,
      name: role.name,
      value: role.name,
      disabled: false,
    }
  })

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-12">
      <div className="flex md:w-1/3 flex-col space-y-2">
        <label className="text-foreground-light text-base" htmlFor="policy-name">
          Target roles
        </label>
        <p className="text-foreground-lighter text-sm">Apply policy to the selected roles</p>
      </div>
      <div className="relative md:w-2/3">
        {isLoading && <ShimmeringLoader className="py-4" />}
        {isError && <AlertError error={error as any} subject="Failed to retrieve database roles" />}
        {isSuccess && (
          <MultiSelector values={selectedRoles} onValuesChange={onUpdateSelectedRoles}>
            <MultiSelectorTrigger
              mode="inline-combobox"
              label={
                selectedRoles.length === 0
                  ? 'Defaults to all (public) roles if none selected'
                  : 'Search for a role'
              }
              deletableBadge
              badgeLimit="wrap"
              showIcon={false}
            />
            <MultiSelectorContent>
              <MultiSelectorList>
                {formattedRoles.map((role) => (
                  <MultiSelectorItem key={role.id} value={role.value} disabled={role.disabled}>
                    {role.name}
                  </MultiSelectorItem>
                ))}
              </MultiSelectorList>
            </MultiSelectorContent>
          </MultiSelector>
        )}
      </div>
    </div>
  )
}
