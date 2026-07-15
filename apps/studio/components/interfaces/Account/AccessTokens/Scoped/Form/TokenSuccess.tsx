import { toast } from 'sonner'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'

interface TokenSuccessProps {
  tokenName: string
  tokenValue: string
}

export const TokenSuccess = ({ tokenName, tokenValue }: TokenSuccessProps) => (
  <div className="space-y-4 px-5 sm:px-6 py-6">
    <div className="space-y-1">
      <h3 className="text-sm text-foreground">Token created</h3>
      <p className="text-xs text-foreground-light">
        Copy your new token{tokenName ? ` "${tokenName}"` : ''} and store it somewhere safe.
      </p>
    </div>

    <Input
      copy
      readOnly
      size="small"
      className="input-mono w-full"
      id="scoped-access-token-value"
      value={tokenValue}
      onChange={() => {}}
      onCopy={() => toast.success('Token copied to clipboard')}
    />

    <Admonition
      type="warning"
      title="This is the only time the token is shown"
      description="You won't be able to see this token value again. If you lose it, revoke the token and create a new one."
    />
  </div>
)
