import { Button, Separator } from 'ui'

import { McpElicitationFooter, McpElicitationShell } from './McpElicitationShell'
import { InterstitialAccountRow } from '@/components/layouts/InterstitialLayout'

/**
 * The request was created by a different account. We never name or hint at that
 * account — the link may have been forwarded to whoever is reading this — so the
 * only identity on screen is the current browser session.
 */
export const McpElicitationWrongAccount = ({
  signedInAs,
  onSwitchAccount,
}: {
  signedInAs: string
  onSwitchAccount: () => void
}) => (
  <McpElicitationShell
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

    <McpElicitationFooter align="start">
      After switching, ask your agent to run the tool again. Nothing has been stored.
    </McpElicitationFooter>
  </McpElicitationShell>
)
