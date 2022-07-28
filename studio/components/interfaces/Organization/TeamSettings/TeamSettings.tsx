import { useState, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, IconSearch } from '@supabase/ui'

import { checkPermissions, useFlag, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import InviteMemberModal from './InviteMemberModal'
import MembersView from './MembersView'

import { PageContext } from 'pages/org/[slug]/settings'
import { PermissionAction } from '@supabase/shared-types/out/constants'

const TeamSettings = observer(() => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const [isLeaving, setIsLeaving] = useState(false)
  const enablePermissions = useFlag('enablePermissions')

  const slug = ui.selectedOrganization?.slug
  const isOrgOwner = ui.selectedOrganization?.is_owner
  const canAddMembers = enablePermissions
    ? checkPermissions(PermissionAction.SQL_INSERT, 'postgres.auth.subject_roles')
    : isOrgOwner

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
                <InviteMemberModal members={PageState.members} user={PageState.user} />
              </div>
            )}
            {!isOrgOwner && (
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
