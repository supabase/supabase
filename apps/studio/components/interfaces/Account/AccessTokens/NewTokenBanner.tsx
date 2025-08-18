import { toast } from 'sonner'

import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

interface NewTokenBannerProps {
  token: NewAccessToken
}

export const NewTokenBanner = ({ token }: NewTokenBannerProps) => {
  return (
    <Admonition
      type="default"
      title="Successfully generated a new token!"
      className="mb-6"
      description={
        <>
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
                className="input-mono"
                value={token.token}
                onChange={() => {}}
                onCopy={() => toast.success('Token copied to clipboard')}
              />
            </div>
          </div>
        </>
      }
    />
  )
}
