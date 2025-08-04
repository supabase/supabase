import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'
import { Input } from 'ui'
import { Admonition } from 'ui-patterns'
import { toast } from 'sonner'

interface NewTokenBannerProps {
  token: NewAccessToken
}

const NewTokenBanner = ({ token }: NewTokenBannerProps) => {
  return (
    <Admonition
      type="default"
      title="Successfully generated a new token!"
      description={
        <>
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
              onCopy={() => toast.success('Token copied to clipboard')}
            />
          </div>
        </>
      }
    />
  )
}

export default NewTokenBanner
