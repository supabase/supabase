import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { Input } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { InviteMemberButton } from './InviteMemberButton'
import MembersView from './MembersView'
import { hasMultipleOwners, useGetRolesManagementPermissions } from './TeamSettings.utils'
import EnforceMFAToggle from './EnforceMFAToggle'

const TeamSettings = () => {
  const {
    organizationMembersCreate: organizationMembersCreationEnabled,
    organizationMembersDelete: organizationMembersDeletionEnabled,
  } = useIsFeatureEnabled(['organization_members:create', 'organization_members:delete'])

  const { slug } = useParams()
  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()
  const isOwner = selectedOrganization?.is_owner

  const { data: permissions } = usePermissionsQuery()
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
    onSuccess: () => {
      setIsLeaving(false)
      setIsLeaveTeamModalOpen(false)
      window?.location.replace(BASE_PATH) // Force reload to clear Store
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
        <ScaffoldSectionContent className="w-full">
          <EnforceMFAToggle />
        </ScaffoldSectionContent>
        <ScaffoldFilterAndContent>
          <ScaffoldActionsContainer className="w-full flex-col md:flex-row gap-2 justify-between">
            <Input
              autoComplete="off"
              icon={<Search size={12} />}
              size="small"
              className="w-full md:w-auto"
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

export default TeamSettings
