import { Input_Shadcn_ } from 'ui'
import CopyButton from 'components/ui/CopyButton'

interface Step4TokenGeneratedProps {
  generatedToken: any
  onCopy: () => void
}

const Step4TokenGenerated = ({ generatedToken, onCopy }: Step4TokenGeneratedProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm text-foreground-light">
          Do copy this access token and store it in a secure place - you will not be able to see it
          again.
        </p>
        <div className="flex items-center gap-2">
          <Input_Shadcn_
            value={generatedToken?.token}
            readOnly
            className="flex-1 input-mono"
            id="generatedToken"
          />
          <CopyButton 
            text={generatedToken?.token} 
            onCopy={onCopy}
          />
        </div>
      </div>
    </div>
  )
}

export default Step4TokenGenerated 