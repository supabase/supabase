import { Search } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { InviteMemberButton } from './InviteMemberButton'
import MembersView from './MembersView'
import { hasMultipleOwners, useGetRolesManagementPermissions } from './TeamSettings.utils'

export const TeamSettings = () => {
  const [_, setLastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const {
    organizationMembersCreate: organizationMembersCreationEnabled,
    organizationMembersDelete: organizationMembersDeletionEnabled,
  } = useIsFeatureEnabled(['organization_members:create', 'organization_members:delete'])

  const { slug } = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()
  const isOwner = selectedOrganization?.is_owner

  const { data: permissions } = usePermissionsQuery()
  const { refetch: refetchOrganizations } = useOrganizationsQuery()
  const { data: rolesData } = useOrganizationRolesV2Query({ slug })
  const { data: members } = useOrganizationMembersQuery({ slug })

  const roles = rolesData?.org_scoped_roles ?? []

  const { rolesAddable } = useGetRolesManagementPermissions(
    selectedOrganization?.slug,
    roles,
    permissions ?? []
  )

  const [isLeaving, setIsLeaving] = useState(false)
  const [searchString, setSearchString] = useState('')

  const canAddMembers = rolesAddable.length > 0
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

  const [isLeaveTeamModalOpen, setIsLeaveTeamModalOpen] = useState(false)

  const leaveTeam = async () => {
    if (!slug) return console.error('Org slug is required')

    setIsLeaving(true)
    deleteMember({ slug, gotrueId: profile!.gotrue_id })
  }

  return (
    <>
      <ScaffoldContainerLegacy>
        <ScaffoldTitle>Team</ScaffoldTitle>
        <ScaffoldFilterAndContent>
          <ScaffoldActionsContainer className="w-full flex-col md:flex-row gap-2 justify-between">
            <Input
              size="tiny"
              autoComplete="off"
              icon={<Search size={12} />}
              value={searchString}
              onChange={(e: any) => setSearchString(e.target.value)}
              name="email"
              id="email"
              placeholder="Filter members"
            />
            <ScaffoldActionsGroup className="w-full md:w-auto">
              {organizationMembersCreationEnabled &&
                canAddMembers &&
                profile !== undefined &&
                selectedOrganization !== undefined && <InviteMemberButton />}
              {/* if organizationMembersDeletionEnabled is false, you also can't delete yourself */}
              {organizationMembersDeletionEnabled && (
                <>
                  <ButtonTooltip
                    type="default"
                    loading={isLeaving}
                    disabled={!canLeave}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canLeave ? 'An organization requires at least 1 owner' : undefined,
                      },
                    }}
                    onClick={() => setIsLeaveTeamModalOpen(true)}
                  >
                    Leave team
                  </ButtonTooltip>
                </>
              )}
            </ScaffoldActionsGroup>
          </ScaffoldActionsContainer>
          <ScaffoldSectionContent className="w-full">
            <MembersView searchString={searchString} />
          </ScaffoldSectionContent>
        </ScaffoldFilterAndContent>
      </ScaffoldContainerLegacy>

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
