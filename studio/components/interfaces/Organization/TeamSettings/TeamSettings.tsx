import { useState, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, IconSearch } from '@supabase/ui'

import { useFlag, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import InviteMemberModal from './InviteMemberButton'
import MembersView from './MembersView'
import { getRolesManagementPermissions } from './TeamSettings.utils'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

import { PageContext } from 'pages/org/[slug]/settings'

const TeamSettings = observer(() => {
  const PageState: any = useContext(PageContext)
  const { user, members, roles } = PageState
  const { rolesAddable } = getRolesManagementPermissions(roles)

  const { ui } = useStore()
  const slug = ui.selectedOrganization?.slug ?? ''
  const isOwner = ui.selectedOrganization?.is_owner

  const enablePermissions = useFlag('enablePermissions')
  const [isLeaving, setIsLeaving] = useState(false)

  const canAddMembers = enablePermissions ? rolesAddable.length > 0 : isOwner

  function onFilterMemberChange(e: any) {
    PageState.membersFilterString = e.target.value
  }

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
            value={PageState.membersFilterString}
            onChange={onFilterMemberChange}
            name="email"
            id="email"
            placeholder="Filter members"
          />
          <div className="flex items-center space-x-4">
            {canAddMembers && (
              <div>
                <InviteMemberModal
                  user={user}
                  members={members}
                  roles={roles}
                  rolesAddable={rolesAddable}
                />
              </div>
            )}
            {!isOwner && (
              <div>
                <Button type="default" onClick={() => leaveTeam()} loading={isLeaving}>
                  Leave team
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="container my-4 max-w-4xl space-y-8">
        <MembersView />
      </div>
    </>
  )
})

export default TeamSettings
