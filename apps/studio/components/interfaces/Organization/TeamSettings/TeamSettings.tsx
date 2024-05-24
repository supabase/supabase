import * as Tooltip from '@radix-ui/react-tooltip'
import { Search } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useIsFeatureEnabled, useSelectedOrganization } from 'hooks'
import { useProfile } from 'lib/profile'
import { Button, Input } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import InviteMemberButton from './InviteMemberButton'
import MembersView from './MembersView'
import { hasMultipleOwners, useGetRolesManagementPermissions } from './TeamSettings.utils'

const TeamSettings = () => {
  const { slug } = useParams()

  const {
    organizationMembersCreate: organizationMembersCreationEnabled,
    organizationMembersDelete: organizationMembersDeletionEnabled,
  } = useIsFeatureEnabled(['organization_members:create', 'organization_members:delete'])

  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()
  const isOwner = selectedOrganization?.is_owner

  const { data: permissions } = usePermissionsQuery()
  const { data: rolesData } = useOrganizationRolesQuery({ slug })
  const { data: members } = useOrganizationMembersQuery({ slug })

  const roles = rolesData?.roles ?? []

  const { rolesAddable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
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
      window?.location.replace('/') // Force reload to clear Store
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
        <ScaffoldFilterAndContent>
          <ScaffoldActionsContainer className="justify-between">
            <Input
              icon={<Search size={12} />}
              size="small"
              value={searchString}
              onChange={(e: any) => setSearchString(e.target.value)}
              name="email"
              id="email"
              placeholder="Filter members"
            />
            <ScaffoldActionsGroup>
              {organizationMembersCreationEnabled &&
                canAddMembers &&
                profile !== undefined &&
                selectedOrganization !== undefined && (
                  <div>
                    <InviteMemberButton
                      orgId={selectedOrganization.id}
                      userId={profile.id}
                      members={members ?? []}
                      roles={roles}
                      rolesAddable={rolesAddable}
                    />
                  </div>
                )}
              {/* if organizationMembersDeletionEnabled is false, you also can't delete yourself */}
              {organizationMembersDeletionEnabled && (
                <div>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <Button
                        type="default"
                        disabled={!canLeave}
                        onClick={() => setIsLeaveTeamModalOpen(true)}
                        loading={isLeaving}
                      >
                        Leave team
                      </Button>
                    </Tooltip.Trigger>
                    {!canLeave && (
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow',
                              'border border-background',
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">
                              An organization requires at least 1 owner
                            </span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                </div>
              )}
            </ScaffoldActionsGroup>
          </ScaffoldActionsContainer>
          <ScaffoldSectionContent className="w-full">
            <MembersView searchString={searchString} />
          </ScaffoldSectionContent>
        </ScaffoldFilterAndContent>
      </ScaffoldContainerLegacy>

      <ConfirmationModal
        visible={isLeaveTeamModalOpen}
        title="Are you sure?"
        confirmLabel="Leave"
        onCancel={() => setIsLeaveTeamModalOpen(false)}
        onConfirm={() => {
          leaveTeam()
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to leave this organization? This is permanent.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default TeamSettings
