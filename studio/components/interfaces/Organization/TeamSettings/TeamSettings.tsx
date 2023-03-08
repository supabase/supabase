import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, IconSearch } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useStore, useParams } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useProfileQuery } from 'data/profile/profile-query'
import InviteMemberButton from './InviteMemberButton'
import MembersView from './MembersView'
import { getRolesManagementPermissions, hasMultipleOwners } from './TeamSettings.utils'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'

const TeamSettings = () => {
  const { ui } = useStore()
  const { slug } = useParams()

  const { data: profile } = useProfileQuery()
  const isOwner = ui.selectedOrganization?.is_owner

  const { data: detailData } = useOrganizationDetailQuery({ slug })
  const { data: rolesData } = useOrganizationRolesQuery({ slug })

  const members = detailData?.members ?? []
  const roles = rolesData?.roles ?? []

  const { rolesAddable } = getRolesManagementPermissions(roles)

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
          const response = await post(`${API_URL}/organizations/${slug}/members/leave`, {})
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
                )}
              </Tooltip.Root>
            </div>
          </div>
        </div>
      </div>
      <div className="container my-4 max-w-4xl space-y-8">
        <MembersView searchString={searchString} roles={roles} members={members} />
      </div>
    </>
  )
}

export default observer(TeamSettings)
