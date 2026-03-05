import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { TokenPermissionsSection } from './TokenPermissionSection'
import { useGroupedPermissions } from '../hooks/useGroupedPermissions'

interface AccessTokenNewBannerProps<T> {
  token: T
  onClose: () => void
  getTokenValue: (token: T) => string
  getTokenPermissions?: (token: T) => string[] | undefined
  title?: string
  description?: string
}

export const AccessTokenNewBanner = <T,>({
  token,
  onClose,
  getTokenValue,
  getTokenPermissions,
  title = 'Successfully generated a new token!',
  description = 'Copy this access token and store it in a secure place. You will not be able to see it again.',
}: AccessTokenNewBannerProps<T>) => {
  const tokenPermissions = getTokenPermissions?.(token)
  const { groupedPermissions, totalCount } = useGroupedPermissions(tokenPermissions)

  return (
    <Admonition
      type="tip"
      title={title}
      className="mb-6 relative"
      actions={
        <Button
          type="text"
          icon={<X />}
          className="w-7 h-7 absolute top-2.5 right-2.5"
          onClick={onClose}
        />
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground-light">{description}</p>
        <div className="w-full pb-2">
          <Input
            copy
            readOnly
            size="small"
            className="w-full input-mono"
            id="access-token-value"
            value={getTokenValue(token)}
            onChange={() => {}}
            onCopy={() => toast.success('Token copied to clipboard')}
          />
        </div>

        {tokenPermissions && tokenPermissions.length > 0 && (
          <TokenPermissionsSection
            groupedPermissions={groupedPermissions}
            totalCount={totalCount}
          />
        )}
      </div>
    </Admonition>
  )
}
