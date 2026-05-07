import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { hasMultipleOwners } from './TeamSettings.utils'

export const LeaveTeamButton = () => {
  const router = useRouter()
  const { slug } = useParams()
  const { profile } = useProfile()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  // if organizationMembersDeletionEnabled is false, you also can't delete yourself
  const { organizationMembersDelete: organizationMembersDeletionEnabled } = useIsFeatureEnabled([
    'organization_members:delete',
  ])

  const [isLeaving, setIsLeaving] = useState(false)
  const [isLeaveTeamModalOpen, setIsLeaveTeamModalOpen] = useState(false)
  const [_, setLastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const { refetch: refetchOrganizations } = useOrganizationsQuery()
  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles } = useOrganizationRolesV2Query({ slug })

  const roles = allRoles?.org_scoped_roles ?? []
  const currentUserMember = members?.find((member) => member.gotrue_id === profile?.gotrue_id)
  const currentUserRoleId = currentUserMember?.role_ids?.[0]
  const currentUserRole = roles.find((role) => role.id === currentUserRoleId)
  const isAdmin = currentUserRole?.name === 'Administrator'
  const isOwner = selectedOrganization?.is_owner

  const canLeave = !isOwner || (isOwner && hasMultipleOwners(members, roles))

  const { mutate: deleteMember } = useOrganizationMemberDeleteMutation({
    onSuccess: async () => {
      setIsLeaving(false)
      setIsLeaveTeamModalOpen(false)

      await refetchOrganizations()
      toast.success(`Successfully left ${selectedOrganization?.name}`)

      setLastVisitedOrganization('')
      router.push('/organizations')
    },
    onError: (error) => {
      setIsLeaving(false)
      toast.error(`Failed to leave organization: ${error?.message}`)
    },
  })

  const leaveTeam = async () => {
    if (!slug) return console.error('Org slug is required')
    if (!profile) return console.error('Profile is required')

    setIsLeaving(true)
    deleteMember({ slug, gotrueId: profile.gotrue_id })
  }

  return (
    <>
      <ButtonTooltip
        type="default"
        disabled={!canLeave || !organizationMembersDeletionEnabled || isLeaving}
        onClick={() => setIsLeaveTeamModalOpen(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canLeave
              ? 'An organization requires at least 1 owner'
              : !organizationMembersDeletionEnabled
                ? 'Unable to leave organization'
                : undefined,
          },
        }}
      >
        Leave team
      </ButtonTooltip>
      <ConfirmationModal
        size="medium"
        visible={isLeaveTeamModalOpen}
        title="Confirm to leave organization"
        confirmLabel="Leave"
        variant="warning"
        alert={{
          title: 'All of your user content will be permanently removed.',
          description: (
            <div>
              <p>
                Leaving the organization will delete all of your saved content in the projects of
                the organization, which includes:
              </p>
              <ul className="list-disc pl-4">
                <li>
                  SQL snippets <span className="text-foreground">(both private and shared)</span>
                </li>
                <li>Custom reports</li>
                <li>Log Explorer queries</li>
              </ul>
              {(isOwner || isAdmin) && (
                <div className="mt-2">
                  <p>
                    <span className="text-foreground">
                      Leaving won't remove your payment method or stop payments.
                    </span>
                  </p>
                  <ul className="list-disc pl-4">
                    <li>
                      The current payment method will remain active and may still be charged after
                      you leave.
                    </li>
                    <li>The billing address will remain unchanged.</li>
                  </ul>
                </div>
              )}
            </div>
          ),
        }}
        onCancel={() => setIsLeaveTeamModalOpen(false)}
        onConfirm={() => leaveTeam()}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to leave this organization? This is permanent.
        </p>
      </ConfirmationModal>
    </>
  )
}
