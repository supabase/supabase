import { Button } from 'ui'
import Link from 'next/link'

export default function BecomeAPartner() {
  return (
    <div className="border-t">
      <div id="become-a-partner" className="mx-auto max-w-2xl space-y-12 py-32 px-6 text-center">
        <h2 className="h2">Want to share with the community?</h2>
        <Button asChild size="medium" className="text-white">
          <Link
            href="https://supabase.com/dashboard/org/_/integrations"
            as="https://supabase.com/dashboard/org/_/integrations"
          >
            List your integration
          </Link>
        </Button>
      </div>
    </div>
  )
}
