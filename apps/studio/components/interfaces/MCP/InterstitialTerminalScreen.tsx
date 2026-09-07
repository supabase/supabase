import { Admonition } from 'ui-patterns/Admonition'

import { InterstitialFooter, InterstitialShell } from './InterstitialShell'

/**
 * Copy for a terminal screen. Every `/mcp/*` interstitial ends on one of
 * these — the tool call is over, nothing more to do here, and the callout
 * tells the user how to get back to their client.
 */
export type InterstitialTerminalCopy = {
  title: string
  subtitle: string
  calloutTitle: string
  calloutBody: string
  footer: string
}

/**
 * Read-only end state for an interstitial: what happened, what to do next,
 * and a footer. Takes copy rather than a state, so each interstitial keeps
 * its own state union and maps it to copy itself.
 */
export const InterstitialTerminalScreen = ({
  title,
  subtitle,
  calloutTitle,
  calloutBody,
  footer,
}: InterstitialTerminalCopy) => (
  <InterstitialShell title={title} subtitle={subtitle}>
    <Admonition type="note" title={calloutTitle} description={calloutBody} className="mb-0" />
    <InterstitialFooter>{footer}</InterstitialFooter>
  </InterstitialShell>
)
