import { PermissionAction } from '@supabase/shared-types/out/constants'
import { MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationCreateInvitationMutation } from 'data/organization-members/organization-invitation-create-mutation'
import { useOrganizationDeleteInvitationMutation } from 'data/organization-members/organization-invitation-delete-mutation'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { useOrganizationMemberInviteDeleteMutation } from 'data/organizations/organization-member-invite-delete-mutation'
import {
  useOrganizationMembersQuery,
  type OrganizationMember,
} from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useHasAccessToProjectLevelPermissions } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'
import { UpdateRolesPanel } from './UpdateRolesPanel/UpdateRolesPanel'

interface MemberActionsProps {
  member: OrganizationMember
}

export const MemberActions = ({ member }: MemberActionsProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const organizationMembersDeletionEnabled = useIsFeatureEnabled('organization_members:delete')

  const selectedOrganization = useSelectedOrganization()
  const { data: permissions } = usePermissionsQuery()
  const { data: allProjects } = useProjectsQuery()
  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: allRoles } = useOrganizationRolesV2Query({ slug })
  const isOptedIntoProjectLevelPermissions = useHasAccessToProjectLevelPermissions(slug as string)

  const orgScopedRoles = allRoles?.org_scoped_roles ?? []
  const projectScopedRoles = allRoles?.project_scoped_roles ?? []
  const isPendingInviteAcceptance = !!member.invited_id

  const userMemberData = members?.find((m) => m.gotrue_id === profile?.gotrue_id)
  const hasOrgRole =
    (userMemberData?.role_ids ?? []).length === 1 &&
    orgScopedRoles.some((r) => r.id === userMemberData?.role_ids[0])

  const { rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.slug,
    orgScopedRoles.concat(projectScopedRoles),
    permissions ?? []
  )

  const roleId = member.role_ids?.[0] ?? -1
  const canRemoveMember = member.role_ids.every((id) => rolesRemovable.includes(id))
  const canResendInvite =
    useCheckPermissions(PermissionAction.CREATE, 'user_invites', {
      resource: { role_id: roleId },
    }) && hasOrgRole
  const canRevokeInvite =
    useCheckPermissions(PermissionAction.DELETE, 'user_invites', {
      resource: { role_id: roleId },
    }) && hasOrgRole

  const { mutate: deleteOrganizationMember, isLoading: isDeletingMember } =
    useOrganizationMemberDeleteMutation({
      onSuccess: () => {
        toast.success(`Successfully removed ${member.primary_email}`)
        setIsDeleteModalOpen(false)
      },
    })

  const { mutate: inviteMember, isLoading: isCreatingInvite } =
    useOrganizationCreateInvitationMutation({
      onSuccess: () => {
        toast.success('Resent the invitation.')
      },
      onError: (error) => {
        toast.error(`Failed to resend invitation: ${error.message}`)
      },
    })
  const { mutate: inviteMemberOld, isLoading: isCreatingInviteOld } =
    useOrganizationMemberInviteCreateMutation({
      onSuccess: () => {
        toast.success('Resent the invitation')
      },
      onError: (error) => {
        toast.error(`Failed to resend the invidation: ${error.message}`)
      },
    })

  const { mutate: deleteInvitation, isLoading: isDeletingInvite } =
    useOrganizationDeleteInvitationMutation()
  const { mutate: deleteInvitationOld } = useOrganizationMemberInviteDeleteMutation()

  const isLoading = isDeletingMember || isDeletingInvite || isCreatingInvite

  const handleMemberDelete = () => {
    if (!slug) return console.error('slug is required')
    if (!member.gotrue_id) return console.error('gotrue_id is required')
    deleteOrganizationMember({ slug, gotrueId: member.gotrue_id })
  }

  const handleResendInvite = (member: OrganizationMember) => {
    const roleId = (member?.role_ids ?? [])[0]
    const invitedId = member.invited_id

    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    if (isOptedIntoProjectLevelPermissions) {
      deleteInvitation(
        { slug, id: invitedId, skipInvalidation: true },
        {
          onSuccess: () => {
            if (!member.primary_email) return toast.error('Email is required')
            const projectScopedRole = projectScopedRoles.find((role) => role.id === roleId)
            if (projectScopedRole !== undefined) {
              const projects = (projectScopedRole?.project_ids ?? [])
                .map((id) => allProjects?.find((p) => p.id === id)?.ref)
                .filter(Boolean) as string[]
              inviteMember({
                slug,
                email: member.primary_email,
                roleId: projectScopedRole.base_role_id,
                projects,
              })
            } else {
              inviteMember({ slug, email: member.primary_email, roleId })
            }
          },
        }
      )
    } else {
      deleteInvitationOld(
        { slug, invitedId, invalidateDetail: false },
        {
          onSuccess: () => {
            inviteMemberOld({
              slug,
              invitedEmail: member.primary_email!,
              ownerId: invitedId,
              roleId,
            })
          },
        }
      )
    }
  }

  const handleRevokeInvitation = (member: OrganizationMember) => {
    const invitedId = member.invited_id
    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    if (isOptedIntoProjectLevelPermissions) {
      deleteInvitation(
        { slug, id: invitedId },
        { onSuccess: () => toast.success('Successfully revoked the invitation.') }
      )
    } else {
      deleteInvitationOld(
        { slug, invitedId },
        { onSuccess: () => toast.success('Successfully revoked the invitation.') }
      )
    }
  }

  if (!canRemoveMember || (isPendingInviteAcceptance && !canResendInvite && !canRevokeInvite)) {
    return (
      <div className="flex items-center justify-end">
        <ButtonTooltip
          disabled
          type="text"
          className="px-1.5"
          icon={<MoreVertical size={18} />}
          tooltip={{
            content: {
              side: 'bottom',
              text: 'You need additional permissions to manage this team member',
            },
          }}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-end gap-x-2">
        <ButtonTooltip
          type="default"
          disabled={isPendingInviteAcceptance || !canRemoveMember}
          onClick={() => setShowAccessModal(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: isPendingInviteAcceptance
                ? 'Role can only be changed after the user has accepted the invite'
                : !canRemoveMember
                  ? 'You need additional permissions to manage this team member'
                  : undefined,
            },
          }}
        >
          Manage access
        </ButtonTooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              className="px-1.5"
              disabled={isLoading}
              loading={isLoading}
              icon={<MoreVertical />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-52">
            <>
              {isPendingInviteAcceptance ? (
                <>
                  {canRevokeInvite && (
                    <DropdownMenuItem onClick={() => handleRevokeInvitation(member)}>
                      <div className="flex flex-col">
                        <p>Cancel invitation</p>
                        <p className="text-foreground-lighter">Revoke this invitation.</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {canResendInvite && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                        <div className="flex flex-col">
                          <p>Resend invitation</p>
                          <p className="text-foreground-lighter">Invites expire after 24hrs.</p>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                organizationMembersDeletionEnabled && (
                  <DropdownMenuItem
                    className="space-x-2 items-start"
                    disabled={!canRemoveMember}
                    onClick={() => {
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <Trash size={16} />
                    <div className="flex flex-col">
                      <p>Remove member</p>
                      {!canRemoveMember && (
                        <p className="text-foreground-lighter">Additional permissions required</p>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              )}
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmationModal
        size="large"
        visible={isDeleteModalOpen}
        loading={isDeletingMember}
        title="Confirm to remove member"
        confirmLabel="Remove"
        variant="warning"
        alert={{
          title: 'All user content from this member will be permanently removed.',
          description: (
            <div>
              Removing a member will delete all of the user's saved content in all projects of this
              organization, which includes:
              <ul className="list-disc pl-4 my-2">
                <li>
                  SQL snippets{' '}
                  <span className="text-foreground">
                    (both <span className="underline">private</span> and{' '}
                    <span className="underline">shared</span> snippets)
                  </span>
                </li>
                <li>Custom reports</li>
                <li>Log Explorer queries</li>
              </ul>
              <p className="mt-4 text-foreground-lighter">
                If you'd like to retain the member's shared SQL snippets, right click on them and
                "Duplicate personal copy" in the SQL Editor before removing this member.
              </p>
            </div>
          ),
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleMemberDelete()
        }}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to remove{' '}
          <span className="text-foreground">{member.primary_email}</span> from{' '}
          <span className="text-foreground">{selectedOrganization?.name}</span>?
        </p>
      </ConfirmationModal>

      <UpdateRolesPanel
        visible={showAccessModal}
        member={member}
        onClose={() => setShowAccessModal(false)}
      />
    </>
  )
}
