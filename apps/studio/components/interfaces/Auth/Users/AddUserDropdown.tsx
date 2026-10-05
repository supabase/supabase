import { ChevronDown, Mail, UserPlus } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from 'ui'

import CreateUserModal from './CreateUserModal'
import InviteUserModal from './InviteUserModal'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { ShortcutBadge } from '@/components/ui/ShortcutBadge'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export const AddUserDropdown = () => {
  const showSendInvitation = useIsFeatureEnabled('authentication:show_send_invitation')

  const { can: canInviteUsers } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_WRITE
  )

  const { can: canCreateUsers } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_WRITE
  )

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
          <Button variant="primary" iconRight={<ChevronDown size={14} strokeWidth={1.5} />}>
            Add user
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-52">
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
              <Mail size={14} className="shrink-0" />
              <p className="flex-1 min-w-0">Send invitation</p>
              {canInviteUsers && (
                <ShortcutBadge
                  shortcutId={SHORTCUT_IDS.AUTH_USERS_INVITE_USER}
                  className="shrink-0"
                />
              )}
            </DropdownMenuItemTooltip>
          )}

          <DropdownMenuItemTooltip
            className="gap-x-2 pointer-events-auto!"
            disabled={!canCreateUsers}
            onClick={() => {
              if (canCreateUsers) setCreateVisible(true)
            }}
            tooltip={{
              content: { side: 'left', text: 'You need additional permissions to create users' },
            }}
          >
            <UserPlus size={14} className="shrink-0" />
            <p className="flex-1 min-w-0">Create new user</p>
            {canCreateUsers && (
              <ShortcutBadge
                shortcutId={SHORTCUT_IDS.AUTH_USERS_CREATE_USER}
                className="shrink-0"
              />
            )}
          </DropdownMenuItemTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUserModal visible={inviteVisible} setVisible={setInviteVisible} />
      <CreateUserModal visible={createVisible} setVisible={setCreateVisible} />
    </>
  )
}
