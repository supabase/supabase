import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'
import { Button, IconSearch, Input } from 'ui'

import { useParams } from 'common/hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useProfile } from 'lib/profile'
import InviteMemberButton from './InviteMemberButton'
import MembersView from './MembersView'
import { hasMultipleOwners, useGetRolesManagementPermissions } from './TeamSettings.utils'

const TeamSettings = () => {
  const { ui } = useStore()
  const { slug } = useParams()

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

  const leaveTeam = async () => {
    setIsLeaving(true)
    try {
      confirmAlert({
        title: 'Are you sure?',
        message: 'Are you sure you want to leave this team? This is permanent.',
        onAsyncConfirm: async () => {
          const response = await delete_(
            `${API_URL}/organizations/${slug}/members/${profile!.gotrue_id}`
          )
          if (response.error) {
            throw response.error
          } else {
            window?.location.replace('/') // Force reload to clear Store
          }
        },
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Error leaving: ${error?.message}`,
      })
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <>
      <div className="container my-4 max-w-4xl space-y-8">
        <div className="flex justify-between">
          <Input
            icon={<IconSearch size="tiny" />}
            size="small"
            value={searchString}
            onChange={(e: any) => setSearchString(e.target.value)}
            name="email"
            id="email"
            placeholder="Filter members"
          />
          <div className="flex items-center space-x-4">
            {canAddMembers && profile !== undefined && (
              <div>
                <InviteMemberButton
                  userId={profile.id}
                  members={members}
                  roles={roles}
                  rolesAddable={rolesAddable}
                />
              </div>
            )}
            <div>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    type="default"
                    disabled={!canLeave}
                    onClick={() => leaveTeam()}
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
                          'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                          'border border-scale-200',
                        ].join(' ')}
                      >
                        <span className="text-xs text-scale-1200">
                          An organization requires at least 1 owner
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </div>
          </div>
        </div>
      </div>
      <div className="container my-4 max-w-4xl space-y-8">
        <MembersView searchString={searchString} />
      </div>
    </>
  )
}

export default TeamSettings
