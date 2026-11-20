import { Button } from 'ui'

import {
  AccountRow,
  InterstitialShell,
  LogoPair,
  SignOutButton,
  StripeLogo,
  SupabaseLogo,
} from './connect-interstitial-shared'

export default function ConnectInterstitialDemo() {
  return (
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
        <Button variant="text" block>
          Cancel
        </Button>
      </div>
    </InterstitialShell>
  )
}
