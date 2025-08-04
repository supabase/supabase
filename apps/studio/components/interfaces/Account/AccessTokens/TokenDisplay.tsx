import { Input_Shadcn_ } from 'ui'
import { toast } from 'sonner'
import CopyButton from 'components/ui/CopyButton'

interface TokenDisplayProps {
  generatedToken: any
}

export const TokenDisplay = ({ generatedToken }: TokenDisplayProps) => {
  const tokenValue = generatedToken?.access_token || generatedToken?.token_alias || generatedToken?.token || ''

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Do copy this access token and store it in a secure place - you will not be
          able to see it again.
        </p>
        <div className="flex items-center gap-2">
          <Input_Shadcn_
            value={tokenValue}
            readOnly
            className="flex-1 input-mono"
            id="generatedToken"
          />
          <CopyButton
            text={tokenValue}
            onCopy={() => toast.success('Access token copied to clipboard')}
          />
        </div>
      </div>
    </div>
  )
} 