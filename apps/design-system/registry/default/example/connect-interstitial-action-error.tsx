import { Button } from 'ui'

import {
  AccountRow,
  InterstitialShell,
  LogoPair,
  StripeLogo,
  SupabaseLogo,
} from './connect-interstitial-shared'

export default function ConnectInterstitialActionError() {
  return (
    <InterstitialShell
      logo={<LogoPair left={<StripeLogo />} right={<SupabaseLogo />} />}
      title="Authorize Stripe Projects"
      description="This will create an organization on your behalf in Supabase"
    >
      <div className="flex flex-col gap-4">
        <AccountRow displayName="alex@example.com" />
        <div className="flex flex-col gap-2">
          <p role="alert" className="text-sm text-destructive">
            Failed to authorize Stripe Projects. Please try again.
          </p>
          <Button variant="primary" block>
            Authorize Stripe Projects
          </Button>
          <Button variant="text" block>
            Cancel
          </Button>
        </div>
      </div>
    </InterstitialShell>
  )
}
