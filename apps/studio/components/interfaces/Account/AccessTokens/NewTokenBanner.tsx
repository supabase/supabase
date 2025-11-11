import { X } from 'lucide-react'
import { toast } from 'sonner'

import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

interface NewTokenBannerProps {
  token: NewAccessToken
  onClose: () => void
}

export const NewTokenBanner = ({ token, onClose }: NewTokenBannerProps) => {
  return (
    <Admonition
      type="default"
      className="relative mb-6"
      title="Successfully generated a new token!"
      description={
        <div className="w-full space-y-2">
          <p className="text-sm">
            Do copy this access token and store it in a secure place - you will not be able to see
            it again.
          </p>
          <div className="max-w-xl">
            <Input
              copy
              readOnly
              size="small"
              className="max-w-xl input-mono"
              value={token.token}
              onChange={() => {}}
              onCopy={() => toast.success('Token copied to clipboard')}
            />
          </div>
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
