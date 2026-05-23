import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'

import { DocsButton } from '@/components/ui/DocsButton'

interface LocalSetupGuideSection {
  body: ReactNode
  docsHref: string
}

interface LocalSetupGuideProps {
  cli: LocalSetupGuideSection
  selfHosted: LocalSetupGuideSection
}

/**
 * Pair of cards used on `!IS_PLATFORM` pages to point users at the right
 * docs for configuring a feature outside of Studio.
 *
 * Renders two `Card`s with fixed section titles — "Local development & CLI"
 * and "Self-Hosted Supabase" — each with a body explaining how to set things
 * up for that audience and a `DocsButton` link.
 */
export const LocalSetupGuide = ({ cli, selfHosted }: LocalSetupGuideProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Local development & CLI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-foreground-light mb-4">{cli.body}</div>
          <DocsButton href={cli.docsHref} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Self-Hosted Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-foreground-light mb-4">{selfHosted.body}</div>
          <DocsButton href={selfHosted.docsHref} />
        </CardContent>
      </Card>
    </>
  )
}
