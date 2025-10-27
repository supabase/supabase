import { ExternalLink, HelpCircle } from 'lucide-react'
import Link from 'next/link'

import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'

export const IPV4SuggestionAlert = () => {
  return (
    <Alert_Shadcn_ variant="default">
      <HelpCircle strokeWidth={2} />
      <AlertTitle_Shadcn_>Connection issues?</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_ className="grid gap-3">
        <p>
          Having trouble connecting to your project? It could be related to our migration from
          PGBouncer and IPv4.
        </p>
        <p>
          Please review this GitHub discussion. It's up to date and covers many frequently asked
          questions.
        </p>
        <p>
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
            <Link
              target="_blank"
              rel="noreferrer"
              href="https://github.com/orgs/supabase/discussions/17817"
            >
              PGBouncer and IPv4 Deprecation #17817
            </Link>
          </Button>
        </p>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
