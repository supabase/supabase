import { Button } from 'ui'
import { SupabaseClient } from '~/lib/supabase'
import Link from 'next/link'

export default function BecomeAPartner({ supabase }: { supabase: SupabaseClient }) {
  return (
    <div className="border-t">
      <div id="become-a-partner" className="mx-auto max-w-2xl space-y-12 py-32 px-6 text-center">
        <h2 className="h2">Ready to work together?</h2>
        <Link href="https://forms.supabase.com/partner" as="https://forms.supabase.com/partner">
          <a>
            <Button size="medium" className="text-white">
              Become a partner
            </Button>
          </a>
        </Link>
      </div>
    </div>
  )
}
