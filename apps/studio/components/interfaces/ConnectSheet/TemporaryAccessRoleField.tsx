import { useFlag } from 'common'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DATABASE_PASSWORD_VALUE } from './TemporaryAccessConnection.utils'
import { useTemporaryAccessConnection } from './TemporaryAccessConnectionProvider'
import { InlineLink } from '@/components/ui/InlineLink'

export function TemporaryAccessPasswordNote() {
  const {
    meta: { isGrantMode },
  } = useTemporaryAccessConnection()

  const scopedTokensEnabled = useFlag('scopedPAT')

  if (!isGrantMode) return null

  return (
    <p className="text-sm text-foreground-lighter mb-1">
      Use a <InlineLink href="/account/tokens">personal access token</InlineLink> as the database
      password.
      {scopedTokensEnabled &&
        ' Choose this project and include the “Database token access” permission.'}
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
        <SelectTrigger size="small" aria-label="Role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DATABASE_PASSWORD_VALUE}>Database password</SelectItem>
          <SelectSeparator />
          {activeRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormItemLayout>
  )
}
