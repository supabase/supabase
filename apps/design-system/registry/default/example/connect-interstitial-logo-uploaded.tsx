import { Button } from 'ui'

import {
  AccountRow,
  InterstitialShell,
  LogoBox,
  LogoPair,
  SignOutButton,
  SupabaseLogo,
} from './connect-interstitial-shared'

/** Stand-in uploaded OAuth icon: checked-in solid-colour bitmap (not a real brand). */
function UploadedAppLogo() {
  return (
    <LogoBox className="border-black/10 bg-white">
      <img
        alt="Acme"
        src={`${process.env.NEXT_PUBLIC_BASE_PATH || '/design-system'}/img/icons/acme-oauth-icon.png`}
        className="size-full object-cover"
      />
    </LogoBox>
  )
}

export default function ConnectInterstitialLogoUploaded() {
  return (
    <InterstitialShell
      logo={<LogoPair left={<UploadedAppLogo />} right={<SupabaseLogo forceLight />} />}
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
