import { Input } from 'ui-patterns/DataInputs/Input'

export default function DataInputWithCopySecret() {
  const actualValue = 'sb_secret_1234567890'
  const maskedValue = 'sb_secret_123•••••••'

  return (
    <Input
      containerClassName="w-full max-w-sm"
      readOnly
      copy
      value={maskedValue}
      onCopy={() => {
        navigator.clipboard.writeText(actualValue)
      }}
    />
  )
}
