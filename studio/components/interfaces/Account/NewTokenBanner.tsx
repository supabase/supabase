import { Alert, Input } from 'ui'
import { observer } from 'mobx-react-lite'
import { NewAccessToken } from 'data/access-tokens/access-tokens-create-mutation'

interface NewTokenBannerProps {
  token: NewAccessToken
}

const NewTokenBanner = observer(({ token }: NewTokenBannerProps) => {
  return (
    <Alert withIcon variant="success" title="Successfully generated a new token!">
      <div className="w-full space-y-2">
        <p className="text-sm">
          Do copy this access token and store it in a secure place - you will not be able to see it
          again.
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
    </Alert>
  )
})

export default NewTokenBanner
