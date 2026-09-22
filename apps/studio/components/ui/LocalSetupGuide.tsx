import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'

import { DocsButton } from '@/components/ui/DocsButton'

export type LocalSetupGuideVariant = 'cli' | 'selfHosted'

interface LocalSetupGuideProps {
  variant: LocalSetupGuideVariant
  body: ReactNode
  docsHref: string
}

const VARIANT_TITLES: Record<LocalSetupGuideVariant, string> = {
  cli: 'Local development & CLI',
  selfHosted: 'Self-Hosted Supabase',
}

/**
 * Card used on `!IS_PLATFORM` pages to point users at the right docs for
 * configuring a feature outside of Studio. Renders a single audience-specific
 * card; call twice (one per variant) and gate each render on the matching
 * `isCli` / `isSelfHosted` flag from `useDeploymentMode`.
 */
export const LocalSetupGuide = ({ variant, body, docsHref }: LocalSetupGuideProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{VARIANT_TITLES[variant]}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-foreground-light mb-4">{body}</div>
        <DocsButton href={docsHref} />
      </CardContent>
    </Card>
  )
}
