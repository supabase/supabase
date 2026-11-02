import { Button } from 'ui'

import {
  AccountRow,
  InterstitialShell,
  SignOutButton,
  SupabaseLogo,
} from './connect-interstitial-shared'

export default function ConnectInterstitialLogoUnknown() {
  return (
    <InterstitialShell
      logo={<SupabaseLogo />}
      title="Authorize Acme"
      description="Acme is requesting access to your organization"
    >
      <div className="flex flex-col gap-4">
        <AccountRow displayName="alex@example.com" action={<SignOutButton />} />
        <Button variant="primary" block>
          Authorize Acme
        </Button>
      </div>
    </InterstitialShell>
  )
}
