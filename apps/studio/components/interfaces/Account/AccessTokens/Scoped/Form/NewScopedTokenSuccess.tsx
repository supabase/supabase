import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Checkbox, ScrollArea, SheetFooter } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'

interface TokenSuccessProps {
  tokenName: string
  tokenValue: string
  onClose: () => void
}

export const NewScopedTokenSuccess = ({ tokenName, tokenValue, onClose }: TokenSuccessProps) => {
  const [keyCopied, setKeyCopied] = useState(false)

  return (
    <>
      <ScrollArea className="flex-1">
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
            aria-label={`${tokenName} token`}
            onCopy={() => toast.success('Token copied to clipboard')}
          />

          <Admonition
            type="warning"
            title="This is the only time the token is shown"
            description="You won't be able to see this token value again. If you lose it, revoke the token and create a new one."
          >
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="flex items-center gap-3 cursor-pointer py-2">
              <Checkbox
                id="key-copied"
                checked={keyCopied}
                onCheckedChange={(v) => setKeyCopied(Boolean(v))}
              />
              <span className="text-sm text-warning cursor-pointer select-none">
                I have copied the key and stored it securely
              </span>
            </label>
          </Admonition>
        </div>
      </ScrollArea>
      <SheetFooter className="mt-auto flex w-full items-center justify-between! border-t py-4">
        <Button className="ml-auto" disabled={!keyCopied} onClick={onClose}>
          Done
        </Button>
      </SheetFooter>
    </>
  )
}
