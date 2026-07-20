import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import {
  AccountRow,
  InterstitialShell,
  LogoPair,
  SignOutButton,
  StripeLogo,
  SupabaseLogo,
} from './connect-interstitial-shared'

export default function ConnectInterstitialLogos() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      <InterstitialShell
        logo={<LogoPair left={<StripeLogo />} right={<SupabaseLogo />} />}
        title="Authorize Stripe Projects"
        description="This will create an organization on your behalf in Supabase"
      >
        <div className="flex flex-col gap-4">
          <AccountRow displayName="alex@example.com" action={<SignOutButton />} />
          <Button variant="primary" block>
            Authorize Stripe Projects
          </Button>
        </div>
      </InterstitialShell>

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
    </div>
  )
}
