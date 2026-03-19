import type { OAuthClient } from '@supabase/supabase-js'
import { X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'

interface NewOAuthAppBannerProps {
  oauthApp: OAuthClient
  onClose: () => void
}

export const NewOAuthAppBanner = ({ oauthApp, onClose }: NewOAuthAppBannerProps) => {
  return (
    <Admonition
      type="default"
      className="relative mb-6"
      title={`Successfully generated credentials for your ${oauthApp.client_name} OAuth app!`}
      description={
        <div className="w-full space-y-2">
          <p className="text-sm">
            Do copy this client id and client secret and store it in a secure place - you will not
            be able to see it again.
          </p>
          <div className="">
            <Input
              copy
              readOnly
              size="small"
              className="input-mono"
              value={oauthApp?.client_id}
              onChange={() => {}}
              onCopy={() => toast.success('Client Id copied to clipboard')}
            />
          </div>
          <div className="">
            <Input
              copy
              readOnly
              size="small"
              className=" input-mono"
              value={oauthApp?.client_secret}
              onChange={() => {}}
              onCopy={() => toast.success('Client secret copied to clipboard')}
            />
          </div>
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
