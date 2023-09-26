import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import semver from 'semver'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconChevronDown,
  IconMail,
  IconUserPlus,
} from 'ui'

import { useCheckPermissions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import CreateUserModal from './CreateUserModal'
import InviteUserModal from './InviteUserModal'

export type AddUserDropdownProps = {
  projectKpsVersion?: string
}

const AddUserDropdown = ({ projectKpsVersion }: AddUserDropdownProps) => {
  const inviteEnabled = IS_PLATFORM
    ? semver.gte(
        // @ts-ignore
        semver.coerce(projectKpsVersion ?? 'kps-v2.5.4'),
        semver.coerce('kps-v2.5.3')
      )
    : true

  const canInviteUsers = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'invite_user')
  const canCreateUsers = useCheckPermissions(PermissionAction.AUTH_EXECUTE, 'create_user')

  const [inviteVisible, setInviteVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)

  return (
    <>
      <DropdownMenu_Shadcn_>
        <DropdownMenuTrigger_Shadcn_>
          <Button type="primary" iconRight={<IconChevronDown strokeWidth={1.5} />}>
            Add user
          </Button>
        </DropdownMenuTrigger_Shadcn_>
        <DropdownMenuContent_Shadcn_ side="bottom" align="end">
          {inviteEnabled && (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger className="w-full">
                <DropdownMenuItem_Shadcn_
                  className="space-x-2"
                  disabled={!canInviteUsers}
                  onClick={() => setInviteVisible(true)}
                >
                  <IconMail size="small" />
                  <p className="text">Send invitation</p>
                </DropdownMenuItem_Shadcn_>
              </Tooltip.Trigger>
              {!canInviteUsers && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                        'border border-scale-200',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to invite users
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          )}

          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-full text-left">
              <DropdownMenuItem_Shadcn_
                className="space-x-2"
                disabled={!canCreateUsers}
                onClick={() => setCreateVisible(true)}
              >
                <IconUserPlus size="small" />
                <p className="text">Create new user</p>
              </DropdownMenuItem_Shadcn_>
            </Tooltip.Trigger>

            {!canCreateUsers && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      You need additional permissions to create users
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </DropdownMenuContent_Shadcn_>
      </DropdownMenu_Shadcn_>

      {inviteEnabled && <InviteUserModal visible={inviteVisible} setVisible={setInviteVisible} />}
      <CreateUserModal visible={createVisible} setVisible={setCreateVisible} />
    </>
  )
}

export default AddUserDropdown
