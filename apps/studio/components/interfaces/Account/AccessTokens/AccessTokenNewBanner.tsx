import { X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

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
  description = 'Do copy this access token and store it in a secure place - you will not be able to see it again.',
}: AccessTokenNewBannerProps<T>) => {
  const permissions = getTokenPermissions?.(token)

  return (
    <Admonition
      type="default"
      className="relative mb-6"
      title={title}
      description={
        <div className="w-full space-y-2">
          <p className="text-sm">{description}</p>
          <div className="max-w-xl">
            <Input
              copy
              readOnly
              size="small"
              className="max-w-xl input-mono"
              value={getTokenValue(token)}
              onChange={() => {}}
              onCopy={() => toast.success('Token copied to clipboard')}
            />
          </div>
          {permissions && permissions.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-foreground-light">
                <strong>Permissions:</strong> {permissions.join(', ')}
              </p>
            </div>
          )}
        </div>
      }
    >
      <Button
        type="text"
        icon={<X />}
        className="w-7 h-7 absolute top-3 right-3"
        onClick={onClose}
      />
    </Admonition>
  )
}
