import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useOrganizationMemberDeleteMutation } from 'data/organizations/organization-member-delete-mutation'
import { useOrganizationMemberInviteCreateMutation } from 'data/organizations/organization-member-invite-create-mutation'
import { useOrganizationMemberInviteDeleteMutation } from 'data/organizations/organization-member-invite-delete-mutation'
import type { OrganizationMember } from 'data/organizations/organization-members-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useCheckPermissions, useIsFeatureEnabled, useSelectedOrganization } from 'hooks'
import Link from 'next/link'
import type { Role } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconMoreHorizontal,
  IconTrash,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { WarningIcon } from 'ui-patterns/Icons/StatusIcons'
import { useGetRolesManagementPermissions } from './TeamSettings.utils'

interface MemberActionsProps {
  member: OrganizationMember
  roles: Role[]
}

const MemberActions = ({ member, roles }: MemberActionsProps) => {
  const { slug } = useParams()
  const organizationMembersDeletionEnabled = useIsFeatureEnabled('organization_members:delete')

  const selectedOrganization = useSelectedOrganization()
  const { data: permissions } = usePermissionsQuery()
  const { rolesRemovable } = useGetRolesManagementPermissions(
    selectedOrganization?.id,
    roles,
    permissions ?? []
  )

  const isPendingInviteAcceptance = member.invited_id

  const roleId = member.role_ids?.[0] ?? -1
  const canRemoveMember = rolesRemovable.includes((member?.role_ids ?? [-1])[0])
  const canResendInvite = useCheckPermissions(PermissionAction.CREATE, 'user_invites', {
    resource: { role_id: roleId },
  })
  const canRevokeInvite = useCheckPermissions(PermissionAction.DELETE, 'user_invites', {
    resource: { role_id: roleId },
  })

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { mutate: deleteOrganizationMember, isLoading: isDeletingMember } =
    useOrganizationMemberDeleteMutation({
      onSuccess: () => {
        toast.success(`Successfully removed ${member.primary_email}`)
        setIsDeleteModalOpen(false)
      },
    })

  const { mutate: createOrganizationMemberInvite, isLoading: isCreatingInvite } =
    useOrganizationMemberInviteCreateMutation({
      onSuccess: () => {
        toast.success('Resent the invitation.')
      },
      onError: (error) => {
        toast.error(`Failed to resend invitation: ${error.message}`)
      },
    })

  const { mutate: asyncDeleteMemberInvite, isLoading: isDeletingInvite } =
    useOrganizationMemberInviteDeleteMutation()

  const handleMemberDelete = async () => {
    if (!slug) return console.error('slug is required')
    if (!member.gotrue_id) return console.error('gotrue_id is required')
    deleteOrganizationMember({ slug, gotrueId: member.gotrue_id })
  }

  const handleResendInvite = async (member: OrganizationMember) => {
    const roleId = (member?.role_ids ?? [])[0]
    const invitedId = member.invited_id

    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    asyncDeleteMemberInvite(
      { slug, invitedId, invalidateDetail: false },
      {
        onSuccess: () => {
          createOrganizationMemberInvite({
            slug,
            invitedEmail: member.primary_email!,
            ownerId: invitedId,
            roleId: roleId,
          })
        },
      }
    )
  }

  const handleRevokeInvitation = async (member: OrganizationMember) => {
    const invitedId = member.invited_id
    if (!slug) return console.error('Slug is required')
    if (!invitedId) return console.error('Member invited ID is required')

    asyncDeleteMemberInvite(
      { slug, invitedId },
      {
        onSuccess: () => {
          toast.success('Successfully revoked the invitation.')
        },
      }
    )
  }

  if (!canRemoveMember || (isPendingInviteAcceptance && !canResendInvite && !canRevokeInvite)) {
    return (
      <div className="flex items-center justify-end">
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button type="text" icon={<IconMoreHorizontal />} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow', // background
                  'border border-background', //border
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  You need additional permissions to manage this team member
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    )
  }

  const isLoading = isDeletingMember || isDeletingInvite || isCreatingInvite

  return (
    <>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" disabled={isLoading} loading={isLoading}>
              <IconMoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <>
              {isPendingInviteAcceptance ? (
                <>
                  {canRevokeInvite && (
                    <DropdownMenuItem onClick={() => handleRevokeInvitation(member)}>
                      <div className="flex flex-col">
                        <p>Cancel invitation</p>
                        <p className="block opacity-50">Revoke this invitation.</p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {/* canResendInvite && isExpired */}
                  {true && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                        <div className="flex flex-col">
                          <p>Resend invitation</p>
                          <p className="block opacity-50">Invites expire after 24hrs.</p>
                        </div>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                organizationMembersDeletionEnabled && (
                  <DropdownMenuItem
                    className="space-x-2"
                    onClick={() => {
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <IconTrash size={16} />
                    <p>Remove member</p>
                  </DropdownMenuItem>
                )
              )}
            </>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmationModal
        visible={isDeleteModalOpen}
        title="Confirm to remove"
        confirmLabel="Remove"
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleMemberDelete()
        }}
      >
        <div className="grid gap-2">
          <p className="text-sm text-foreground-light">
            This is permanent! Are you sure you want to remove {member.primary_email}?
          </p>

          <Alert_Shadcn_ variant="destructive">
            <WarningIcon />
            <AlertTitle_Shadcn_>User content will be deleted</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="grid gap-2">
              <p>
                Any SQL Editor snippets created by this user will also be deleted. To preserve these
                snippets, share them to the project before deleting this user.
              </p>
              <Button type="default" asChild>
                <Link
                  target="_blank"
                  className="justify-self-start"
                  href="https://github.com/supabase/supabase/pull/17814"
                >
                  Learn more
                </Link>
              </Button>
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-3"></AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </div>
      </ConfirmationModal>
    </>
  )
}

export default MemberActions
