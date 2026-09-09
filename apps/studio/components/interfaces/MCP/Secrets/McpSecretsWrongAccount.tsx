import { Button, Separator } from 'ui'

import { InterstitialFooter, InterstitialShell } from '../InterstitialShell'
import { InterstitialAccountRow } from '@/components/layouts/InterstitialLayout'

export const McpSecretsWrongAccount = ({
  signedInAs,
  onSwitchAccount,
}: {
  signedInAs: string
  onSwitchAccount: () => void
}) => (
  <InterstitialShell
    title="This account has no access"
    subtitle="It was created by a different Supabase account."
  >
    <InterstitialAccountRow displayName={signedInAs} />

    <div className="flex flex-col gap-2">
      <Button block variant="primary" onClick={onSwitchAccount}>
        Switch account
      </Button>
      <p className="text-xs text-foreground-light">
        Signing in again will probably expire this request.
      </p>
    </div>

    <Separator />

    <InterstitialFooter align="start">
      After switching, ask your agent to run the tool again. Nothing has been stored.
    </InterstitialFooter>
  </InterstitialShell>
)
