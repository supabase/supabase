import { PERMISSION_MODE_LABEL } from 'shared-data/scoped-access-token-permissions'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DATABASE_PASSWORD_VALUE } from './TemporaryAccessConnection.utils'
import { useTemporaryAccessConnection } from './TemporaryAccessConnectionProvider'
import { InlineLink } from '@/components/ui/InlineLink'

export function TemporaryAccessPasswordNote() {
  const {
    meta: { isGrantMode },
  } = useTemporaryAccessConnection()

  if (!isGrantMode) return null

  return (
    <p className="text-sm text-foreground-lighter mb-1">
      This role uses a personal access token as its password.{' '}
      <InlineLink href="/account/tokens">Create an access token</InlineLink> if you need one. If you
      create a scoped token, choose this project and set “Database token access” to “
      {PERMISSION_MODE_LABEL.read}”.
    </p>
  )
}

export function TemporaryAccessRoleField() {
  const {
    state: { activeRoles, selectedRole },
    actions: { setSelectedRole },
  } = useTemporaryAccessConnection()

  if (activeRoles.length === 0) return null

  return (
    <FormItemLayout isReactForm={false} layout="horizontal" label="Role">
      <Select value={selectedRole} onValueChange={setSelectedRole}>
        <SelectTrigger size="small">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {activeRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={DATABASE_PASSWORD_VALUE}>Database password</SelectItem>
        </SelectContent>
      </Select>
    </FormItemLayout>
  )
}
