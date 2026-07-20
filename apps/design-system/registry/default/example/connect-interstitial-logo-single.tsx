import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { AccountRow, InterstitialShell, SupabaseLogo } from './connect-interstitial-shared'

export default function ConnectInterstitialLogoSingle() {
  return (
    <InterstitialShell
      logo={<SupabaseLogo />}
      title="Join organization"
      description="You have been invited to Acme Labs"
    >
      <div className="flex flex-col gap-4">
        <Admonition
          type="warning"
          title="Wrong account"
          description="Sign in with the Supabase account that received this invite, then open the link again."
        />
        <AccountRow displayName="alex@example.com" />
        <Button variant="primary" block>
          Sign out and continue
        </Button>
      </div>
    </InterstitialShell>
  )
}
