import Link from 'next/link'
import { Button } from 'ui'

export default function PrizeActions() {
  return (
    <div className="w-full gap-2 flex items-center">
      <Button onClick={() => null} type="secondary" size="tiny">
        Claim your ticket
      </Button>
      <Button onClick={() => null} type="default" size="tiny" asChild>
        <Link href="/blog/supabase-hackathon-lw11" target="_blank">
          Join Hackathon
        </Link>
      </Button>
    </div>
  )
}
