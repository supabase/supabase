import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export function WrapperDashboardIntegration({ title, path }: { title: string; path: string }) {
  return (
    <Admonition type="tip" className="mb-4">
      <p>You can enable the {title} wrapper right from the Supabase dashboard.</p>

      <Button asChild>
        <Link
          href={`https://supabase.com/dashboard/project/_/integrations/${path}/overview`}
          className="no-underline"
        >
          Open wrapper in dashboard
        </Link>
      </Button>
    </Admonition>
  )
}
