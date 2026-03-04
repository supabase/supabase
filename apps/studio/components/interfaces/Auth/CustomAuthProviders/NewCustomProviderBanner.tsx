import type { CustomOAuthProvider } from '@supabase/auth-js'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'

interface NewCustomProviderBannerProps {
  provider: CustomOAuthProvider & { client_secret?: string }
  onClose: () => void
}

export const NewCustomProviderBanner = ({ provider, onClose }: NewCustomProviderBannerProps) => {
  return (
    <Admonition
      type="default"
      className="relative mb-6"
      title={`Successfully created custom provider "${provider.name}"!`}
      description={
        <div className="w-full space-y-2">
          <p className="text-sm">
            Do copy this client secret and store it in a secure place - you will not be able to see
            it again.
          </p>
          <div className="">
            <Input
              copy
              readOnly
              label="Client ID"
              size="small"
              className="input-mono"
              value={provider?.client_id}
              onChange={() => {}}
              onCopy={() => toast.success('Client ID copied to clipboard')}
            />
          </div>
          {provider.client_secret && (
            <div className="">
              <Input
                copy
                readOnly
                label="Client Secret"
                size="small"
                className="input-mono"
                value={provider.client_secret}
                onChange={() => {}}
                onCopy={() => toast.success('Client secret copied to clipboard')}
              />
            </div>
          )}
        </div>
      }
    >
      <Button
        type="text"
        icon={<X />}
        className="w-7 h-7 absolute top-0 right-0"
        onClick={onClose}
      />
    </Admonition>
  )
}
