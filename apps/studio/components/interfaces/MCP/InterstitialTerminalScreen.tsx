import { Admonition } from 'ui-patterns/Admonition'

import { InterstitialFooter, InterstitialShell } from './InterstitialShell'

export type InterstitialTerminalCopy = {
  title: string
  subtitle: string
  calloutTitle: string
  calloutBody: string
  footer: string
}

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
