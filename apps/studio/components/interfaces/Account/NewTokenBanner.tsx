import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import { X } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

interface NewTokenBannerProps {
  token: NewAccessToken
  onClose: () => void
}

const NewTokenBanner = ({ token, onClose }: NewTokenBannerProps) => {
  return (
    <Admonition
      type="default"
      className="relative"
      title="Successfully generated a new token!"
      description={
        <div className="w-full space-y-2">
          <p className="text-sm">
            Do copy this access token and store it in a secure place - you will not be able to see
            it again.
          </p>
          <Input
            copy
            readOnly
            size="small"
            className="max-w-xl input-mono"
            value={token.token}
            onChange={() => {}}
          />
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

export default NewTokenBanner
