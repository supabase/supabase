import { ChevronDown, Mail, UserPlus } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'

import CreateUserModal from './CreateUserModal'
import InviteUserModal from './InviteUserModal'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

interface AddUserDropdownProps {
  canInviteUsers: boolean
  canCreateUsers: boolean
}

export const AddUserDropdown = ({ canCreateUsers, canInviteUsers }: AddUserDropdownProps) => {
  const showSendInvitation = useIsFeatureEnabled('authentication:show_send_invitation')

  const [inviteVisible, setInviteVisible] = useQueryState(
    'invite',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [createVisible, setCreateVisible] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="primary" iconRight={<ChevronDown size={14} strokeWidth={1.5} />}>
            Add user
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-40">
          {showSendInvitation && (
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canInviteUsers}
              onClick={() => {
                if (canInviteUsers) setInviteVisible(true)
              }}
              tooltip={{
                content: { side: 'left', text: 'You need additional permissions to invite users' },
              }}
            >
              <Mail size={14} />
              <p>Send invitation</p>
            </DropdownMenuItemTooltip>
          )}

          <DropdownMenuItemTooltip
            className="space-x-2 pointer-events-auto!"
            disabled={!canCreateUsers}
            onClick={() => {
              if (canCreateUsers) setCreateVisible(true)
            }}
            tooltip={{
              content: { side: 'left', text: 'You need additional permissions to create users' },
            }}
          >
            <UserPlus size={14} />
            <p>Create new user</p>
          </DropdownMenuItemTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUserModal visible={inviteVisible} setVisible={setInviteVisible} />
      <CreateUserModal visible={createVisible} setVisible={setCreateVisible} />
    </>
  )
}
