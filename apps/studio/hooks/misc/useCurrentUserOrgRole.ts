import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'

export const useCurrentUserOrgRole = () => {
  const { profile } = useProfile()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: members } = useOrganizationMembersQuery({ slug: organization?.slug })
  const { data: roles } = useOrganizationRolesV2Query({ slug: organization?.slug })

  const userMember = members?.find((m) => m.gotrue_id === profile?.gotrue_id)
  const userRoleId = userMember?.role_ids?.[0]
  const orgScopedRoles = roles?.org_scoped_roles ?? []
  const userRole = orgScopedRoles.find((r) => r.id === userRoleId)

  return {
    roleName: userRole?.name,
    isBillingRole: userRole?.name === 'Billing',
  }
}
