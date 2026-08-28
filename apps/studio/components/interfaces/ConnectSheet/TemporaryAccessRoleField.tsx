import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DATABASE_PASSWORD_VALUE } from './TemporaryAccessConnection.utils'
import { useTemporaryAccessConnection } from './TemporaryAccessConnectionProvider'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

export function TemporaryAccessPasswordNote({ tokenHref }: { tokenHref?: string }) {
  const {
    meta: { isGrantMode },
  } = useTemporaryAccessConnection()

  if (!isGrantMode) return null

  const tokenLabel = tokenHref ? (
    <InlineLink href={tokenHref}>personal access token</InlineLink>
  ) : (
    'personal access token'
  )

  return (
    <p className="text-sm text-foreground-lighter mb-1">
      Use a {tokenLabel} as the password.{' '}
      <InlineLink href={`${DOCS_URL}/guides/platform/temporary-access`}>Learn more</InlineLink>
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
