import { Button, Separator } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { InterstitialFooter, InterstitialShell } from './InterstitialShell'

export type InterstitialTerminalCopy = {
  title: string
  subtitle: string
  calloutTitle: string
  calloutBody: string
  footer: string
  projectRef?: string
}

export const InterstitialTerminalScreen = ({
  title,
  subtitle,
  calloutTitle,
  calloutBody,
  footer,
  projectRef,
}: InterstitialTerminalCopy) => (
  <InterstitialShell title={title} subtitle={subtitle}>
    <Admonition type="note" title={calloutTitle} description={calloutBody} className="mb-0" />

    {projectRef && (
      <Button block variant="default" asChild>
        <a href={`/project/${projectRef}/functions/secrets`}>Go to Edge Functions secrets</a>
      </Button>
    )}

    <Separator />

    <InterstitialFooter>{footer}</InterstitialFooter>
  </InterstitialShell>
)
