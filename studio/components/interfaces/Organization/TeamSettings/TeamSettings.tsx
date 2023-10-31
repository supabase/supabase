import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'

import { useParams } from 'common/hooks'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainerLegacy,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useIsFeatureEnabled, useSelectedOrganization, useStore } from 'hooks'
import { useProfile } from 'lib/profile'
import { Button, IconSearch, Input, Modal } from 'ui'
import InviteMemberButton from './InviteMemberButton'
import MembersView from './MembersView'
import { hasMultipleOwners, useGetRolesManagementPermissions } from './TeamSettings.utils'

const TeamSettings = () => {
  const { ui } = useStore()
  const { slug } = useParams()

  const {
    organizationMembersCreate: organizationMembersCreationEnabled,
    organizationMembersDelete: organizationMembersDeletionEnabled,
  } = useIsFeatureEnabled(['organization_members:create', 'organization_members:delete'])

  const { profile } = useProfile()
  const selectedOrganization = useSelectedOrganization()
  const isOwner = selectedOrganization?.is_owner

  const { data: permissions } = usePermissionsQuery()
  const { data: detailData } = useOrganizationDetailQuery({ slug })
  const { data: rolesData } = useOrganizationRolesQuery({ slug })

  const members = detailData?.members ?? []
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

  const { mutateAsync: deleteMember } = useOrganizationMemberDeleteMutation()

  const [isLeaveTeamModalOpen, setIsLeaveTeamModalOpen] = useState(false)

  const leaveTeam = async () => {
    setIsLeaving(true)
    try {
      if (!slug) return console.error('Org slug is required')
      await deleteMember({ slug, gotrueId: profile!.gotrue_id })
      setIsLeaveTeamModalOpen(false)
      window?.location.replace('/') // Force reload to clear Store
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to leave organization: ${error?.message}`,
      })
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <>
      <ScaffoldContainerLegacy>
        <ScaffoldFilterAndContent>
          <ScaffoldActionsContainer className="justify-between">
            <Input
              icon={<IconSearch size="tiny" />}
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
                      members={members}
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
        header="Are you sure?"
        buttonLabel="Leave"
        onSelectCancel={() => setIsLeaveTeamModalOpen(false)}
        onSelectConfirm={() => {
          leaveTeam()
        }}
      >
        <Modal.Content>
          <p className="py-4 text-sm text-foreground-light">
            Are you sure you want to leave this organization? This is permanent.
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

export default TeamSettings
